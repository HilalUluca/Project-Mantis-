import json
import logging
import os
import re
import traceback
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("mantis.auditor")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_API_URL = f"{OLLAMA_BASE_URL.rstrip('/')}/v1"
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5")


def check_ollama_available(timeout: float = 3.0) -> tuple[bool, str]:
    """Ollama servisinin erişilebilir olup olmadığını kontrol eder."""
    try:
        response = httpx.get(f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags", timeout=timeout)
        if response.status_code == 200:
            return True, "Ollama servisi erişilebilir."
        return False, f"Ollama beklenmeyen yanıt döndü: HTTP {response.status_code}"
    except httpx.ConnectError:
        return False, f"Ollama'ya bağlanılamadı ({OLLAMA_BASE_URL}). Servis çalışıyor mu?"
    except httpx.TimeoutException:
        return False, f"Ollama bağlantı zaman aşımına uğradı ({OLLAMA_BASE_URL})."
    except Exception as exc:
        return False, f"Ollama kontrol hatası: {exc}"


class Auditor:
    """Kurumsal sözleşme denetim motoru (Agent 2)."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        brain_path: str = "corporate_brain.json",
        skip_ollama_check: bool = False,
    ) -> None:
        self.model_name = model_name
        self.brain_path = brain_path
        self.is_ready = False
        self.init_error: Optional[str] = None
        self.agent = None
        self.user_proxy = None
        self.system_prompt = ""
        self.brain: Dict[str, Any] = {}

        try:
            self.brain = self._load_corporate_brain()
            self.system_prompt = self._build_system_prompt()

            if not skip_ollama_check:
                ollama_ok, ollama_msg = check_ollama_available()
                if not ollama_ok:
                    raise ConnectionError(ollama_msg)
                logger.info(ollama_msg)

            import autogen

            llm_config: Dict[str, Any] = {
                "config_list": [{
                    "model": self.model_name,
                    "base_url": OLLAMA_API_URL,
                    "api_key": "not-needed",
                }]
            }

            self.agent = autogen.AssistantAgent(
                name="LegalAuditor",
                system_message=self.system_prompt,
                llm_config=llm_config,
            )

            self.user_proxy = autogen.UserProxyAgent(
                name="UserProxy",
                human_input_mode="NEVER",
                max_consecutive_auto_reply=0,
                code_execution_config={"use_docker": False},
            )

            self.is_ready = True
            logger.info("Auditor motoru başarıyla başlatıldı (model=%s).", self.model_name)

        except Exception as exc:
            self.is_ready = False
            self.init_error = str(exc)
            logger.error("Auditor başlatılamadı: %s", exc)
            logger.debug(traceback.format_exc())

    def _ensure_ready(self) -> None:
        if not self.is_ready:
            detail = self.init_error or "Auditor motoru başlatılamadı."
            raise RuntimeError(detail)

    def _load_corporate_brain(self) -> Dict[str, Any]:
        default_brain: Dict[str, Any] = {
            "system_policy": (
                "Sen kıdemli bir Kurumsal Risk Denetim Ajanısın (Agent 2 - Auditor). "
                "Verilen sözleşmeyi corporate_brain kurallarına göre denetle ve ihlalleri "
                "Red Alert (Kırmızı Alarm) olarak raporla."
            ),
            "rules": [
                "Sınırsız sorumluluk (uncapped liability) maddeleri kesinlikle yasaktır ve Critical Red Alert üretmelidir.",
                "Tek taraflı fesih hakları en az 30 günlük ihbar süresine bağlanmalıdır.",
            ],
            "few_shot_examples": [],
        }

        if not os.path.exists(self.brain_path):
            return default_brain

        try:
            with open(self.brain_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return {
                        "system_policy": data.get("system_policy", default_brain["system_policy"]),
                        "rules": data.get("rules", default_brain["rules"]),
                        "few_shot_examples": data.get("few_shot_examples", []),
                    }
        except Exception as exc:
            logger.warning("corporate_brain.json okunamadı, varsayılan kurallar kullanılacak: %s", exc)

        return default_brain

    def _build_system_prompt(self) -> str:
        policy = self.brain.get("system_policy", "")
        rules = json.dumps(self.brain.get("rules", []), ensure_ascii=False, indent=2)

        return f"""
        {policy}

        GÖREV:
        Sözleşme metnini yukarıdaki kurallarla karşılaştır. Kurallara aykırı veya şirket çıkarlarını riske atan maddeleri tespit et.

        UYULMASI GEREKEN KURALLAR:
        {rules}

        ÇIKTI FORMATI:
        Yanıtın SADECE geçerli bir JSON listesi olmalıdır. Markdown blokları (```json ... ```) kullanabilirsin ancak ek açıklama yapma. Şema şu şekildedir:
        [
            {{
                "risk_id": "R001",
                "severity": "Critical (Red Alert) / High / Medium / Low",
                "red_alert": true,
                "clause_text": "Sözleşmeden alınan ilgili metin",
                "ai_reasoning": "Şirket kurallarına neden aykırı olduğunun hukuki açıklaması",
                "confidence_score": 98
            }}
        ]
        """

    def _parse_findings(self, content: str) -> List[Dict[str, Any]]:
        if not content:
            return []

        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
        raw = fenced.group(1) if fenced else content.strip()

        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict) and "findings" in parsed:
                return parsed.get("findings", [])
        except json.JSONDecodeError:
            pass

        return []

    def analyze_text(self, document_text: str) -> Dict[str, Any]:
        """Agent 2 (Auditor) ana denetim fonksiyonu."""
        self._ensure_ready()

        if not document_text:
            return {"findings": [], "status": "empty"}

        try:
            self.user_proxy.initiate_chat(
                self.agent,
                message=(
                    "Lütfen şu sözleşme metnini kurallara göre denetle ve kural ihlallerini tespit et:\n\n"
                    f"{document_text}"
                ),
                clear_history=True,
            )
        except Exception as exc:
            logger.error("Auditor analiz hatası: %s", exc)
            logger.debug(traceback.format_exc())
            return {"findings": [], "status": "error", "error": str(exc)}

        messages = self.user_proxy.chat_messages.get(self.agent, [])
        if not messages:
            return {"findings": [], "status": "no_response"}

        last_content = messages[-1].get("content", "")
        findings = self._parse_findings(last_content)
        return {"findings": findings, "status": "success"}

    def ask(self, user_message: str) -> str:
        """Chatbot için doğal dilde sohbet yeteneği."""
        self._ensure_ready()

        if not user_message:
            return "Lütfen bir soru girin."

        try:
            chat_prompt = (
                "Sen 'Mantis AI' kurumsal asistanısın. JSON kurallarını bu mesaj için yok say. "
                f"Kullanıcının sorusuna profesyonel Türkçe ile yanıt ver:\n\nKullanıcı: {user_message}"
            )

            self.user_proxy.initiate_chat(
                self.agent,
                message=chat_prompt,
                clear_history=False,
            )

            messages = self.user_proxy.chat_messages.get(self.agent, [])
            if not messages:
                return "Mantis AI şu an yanıt veremiyor."

            return messages[-1].get("content", "").strip()
        except Exception as exc:
            logger.error("Auditor sohbet hatası: %s", exc)
            logger.debug(traceback.format_exc())
            return f"Sohbet motoru hatası: {str(exc)}"


# Geriye dönük uyumluluk
ContractAgent = Auditor
