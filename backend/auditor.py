import json
import logging
import os
import re
import traceback
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("mantis.auditor")

# --- MICROSOFT FOUNDRY LOCAL YAPILANDIRMASI ---
FOUNDRY_LOCAL_ENDPOINT = os.getenv("FOUNDRY_LOCAL_ENDPOINT", "http://127.0.0.1:5272/v1")
FOUNDRY_API_KEY = os.getenv("FOUNDRY_API_KEY", "foundry-local-key")
DEFAULT_MODEL = os.getenv("FOUNDRY_LOCAL_MODEL", "Phi-3.5-mini-instruct-openvino-gpu")
FOUNDRY_TIMEOUT_SECONDS = float(os.getenv("FOUNDRY_TIMEOUT_SECONDS", "120"))
FOUNDRY_ANALYSIS_TIMEOUT_SECONDS = float(os.getenv("FOUNDRY_ANALYSIS_TIMEOUT_SECONDS", "45"))
FOUNDRY_MAX_TOKENS = int(os.getenv("FOUNDRY_MAX_TOKENS", "700"))

MANTIS_PERSONA = (
    "Sen Mantis, bir şirketin günlük operasyonel işlerini (mail, görev, "
    "doküman, takvim) yöneten AI asistanısın. Microsoft Foundry Local altyapısıyla çalışırsın. "
    "Bir chatbot gibi değil, işini bilen, inisiyatif alan ama gereksiz soru sormayan bir ekip arkadaşı "
    "gibi konuşursun. Kısa, doğal, sıcak ama profesyonel bir Türkçeyle yanıt verirsin — "
    "resmi yazışma dili ya da gereksiz kalıp cümleler kullanmazsın. Bir istek belirsizse "
    "tahmin yürütüp uydurma bir şey yapmak yerine önce kısa, net bir soru sorarsın. "
    "Bir işlemi gerçekten yapmadıysan asla yaptığını söylemezsin. "
    "ÖNEMLİ: Cevabın asla hazır şablon doldurma gibi gelmemeli. Verilen gerçek bilgilere dayanarak özgün karar üret, "
    "boşlukları 'Mazeret' gibi genel kelimelerle doldurma; eksikse net bir soru sor. "
    "JSON isteniyorsa sadece JSON üret, markdown, not, örnek açıklama veya tekrar eden cümleler ekleme."
)

def check_foundry_available(timeout: float = 3.0) -> tuple[bool, str]:
    """Microsoft Foundry Local servisinin erişilebilir olup olmadığını kontrol eder."""
    try:
        headers = {"Authorization": f"Bearer {FOUNDRY_API_KEY}"}
        response = httpx.get(f"{FOUNDRY_LOCAL_ENDPOINT.rstrip('/')}/models", headers=headers, timeout=timeout)
        if response.status_code in (200, 401):
            return True, "Microsoft Foundry Local servisi erişilebilir."
        return False, f"Foundry Local beklenmeyen yanıt döndü: HTTP {response.status_code}"
    except httpx.ConnectError:
        return False, f"Foundry Local servisine bağlanılamadı ({FOUNDRY_LOCAL_ENDPOINT}). Servis çalışıyor mu?"
    except httpx.TimeoutException:
        return False, f"Foundry Local zaman aşımına uğradı ({FOUNDRY_LOCAL_ENDPOINT})."
    except Exception as exc:
        return False, f"Foundry Local kontrol hatası: {exc}"

def safe_json_parse(content: str) -> Any:
    """Model çıktısından güvenli JSON çıkarır; markdown ve ek metni tolere eder."""
    if not content or not content.strip():
        return None
    candidates = [content.strip()]
    list_match = re.search(r"\[[\s\S]*\]", content)
    object_match = re.search(r"\{[\s\S]*\}", content)
    if list_match:
        candidates.append(list_match.group(0))
    if object_match:
        candidates.append(object_match.group(0))
    for candidate in candidates:
        try:
            return json.loads(candidate.replace("\\'", "'"))
        except (json.JSONDecodeError, TypeError):
            continue
    return None


class Auditor:
    """
    Microsoft Foundry Local Kurumsal Denetim Motoru (Agent 2) + Genel Sohbet Katmanı.
    Tamamen paylaşımsız (stateless) httpx oturumları üzerinden çalışır, kilitlenme yapmaz.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        brain_path: str = "corporate_brain.json",
        skip_check: bool = False,
    ) -> None:
        self.model_name = model_name
        self.brain_path = brain_path
        self.is_ready = False
        self.init_error: Optional[str] = None
        self.system_prompt = ""
        self.brain: Dict[str, Any] = {}

        try:
            self.brain = self._load_corporate_brain()
            self.system_prompt = self._build_system_prompt()

            if not skip_check:
                ok, msg = check_foundry_available()
                if not ok:
                    self.is_ready = False
                    self.init_error = msg
                    logger.warning("Foundry Local uyumsuz/çalışmıyor: %s", msg)
                else:
                    self.is_ready = True
                    logger.info(msg)
            else:
                self.is_ready = True

            if self.is_ready:
                logger.info(
                    "Auditor motoru başarıyla başlatıldı (model=%s, mod=Microsoft Foundry Local).",
                    self.model_name,
                )
            else:
                logger.warning(
                    "Auditor başlatıldı ama Foundry Local erişilebilir değil; AI akışları manuel/uyarı modunda çalışacak."
                )

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
        Yanıtın SADECE geçerli bir JSON listesi olmalıdır. Markdown blokları (```json ... ```) kullanabilirsin ancak ek açıklama yapma. Şema:
        [
            {{
                "risk_id": "RSK-001",
                "severity": "Critical (Red Alert) / High / Medium / Low",
                "red_alert": true,
                "clause_text": "Sözleşmeden alınan ilgili metin",
                "ai_reasoning": "Şirket kurallarına aykırılık gerekçesi",
                "confidence_score": 98
            }}
        ]
        """

    def _parse_findings(self, content: str) -> List[Dict[str, Any]]:
        if not content:
            return []
        parsed = safe_json_parse(content)
        if isinstance(parsed, list):
            return [item for item in parsed if isinstance(item, dict)]
        if isinstance(parsed, dict) and "findings" in parsed:
            return [item for item in parsed.get("findings", []) if isinstance(item, dict)]
        return []

    def _complete(self, messages: List[Dict[str, str]], timeout: Optional[float] = None, temperature: float = 0.2) -> str:
        """Microsoft Foundry Local API üzerinden izole çıkarım çağrısı."""
        self._ensure_ready()
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "temperature": temperature,
            "max_tokens": FOUNDRY_MAX_TOKENS,
        }
        headers = {
            "Authorization": f"Bearer {FOUNDRY_API_KEY}",
            "Content-Type": "application/json"
        }
        try:
            with httpx.Client(timeout=timeout or FOUNDRY_TIMEOUT_SECONDS) as client:
                response = client.post(
                    f"{FOUNDRY_LOCAL_ENDPOINT.rstrip('/')}/chat/completions",
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPStatusError as exc:
            logger.warning("Foundry completion HTTP hatası (%s), kısa tekrar deneniyor.", exc.response.status_code)
            compact_payload = {**payload, "max_tokens": min(300, FOUNDRY_MAX_TOKENS), "temperature": 0.0}
            with httpx.Client(timeout=timeout or FOUNDRY_TIMEOUT_SECONDS) as client:
                response = client.post(
                    f"{FOUNDRY_LOCAL_ENDPOINT.rstrip('/')}/chat/completions",
                    json=compact_payload,
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()

    def analyze_text(self, document_text: str) -> Dict[str, Any]:
        """Sözleşme risk analizi."""
        self._ensure_ready()

        if not document_text:
            return {"findings": [], "status": "empty"}

        try:
            content = self._complete([
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": f"Lütfen şu sözleşme metnini kurallara göre denetle ve kural ihlallerini tespit et:\n\n{document_text}",
                },
            ], timeout=FOUNDRY_ANALYSIS_TIMEOUT_SECONDS)
        except Exception as exc:
            logger.error("Auditor analiz hatası: %s", exc)
            findings = self._rule_based_findings(document_text)
            return {
                "findings": findings,
                "status": "success" if findings else "error",
                "error": str(exc),
                "fallback_used": bool(findings),
            }

        findings = self._parse_findings(content)
        if not findings:
            findings = self._rule_based_findings(document_text)
        return {"findings": findings, "status": "success" if findings else "error", "fallback_used": not bool(self._parse_findings(content))}

    def _rule_based_findings(self, document_text: str) -> List[Dict[str, Any]]:
        """AI yanıtı geçersiz olduğunda açık politika ihlallerini işaretler."""
        text = document_text.lower()
        findings: List[Dict[str, Any]] = []
        if any(term in text for term in ("sınırsız sorumluluk", "unlimited liability", "uncapped liability")):
            findings.append({
                "risk_id": "RULE-UNCAPPED-LIABILITY",
                "severity": "Critical (Red Alert)",
                "red_alert": True,
                "clause_text": "Sınırsız sorumluluk",
                "ai_reasoning": "Sınırsız sorumluluk şirket politikasına göre kabul edilemez.",
                "confidence_score": 99,
            })
        if any(term in text for term in ("tek taraflı fesih", "one-sided termination", "unilateral termination")):
            findings.append({
                "risk_id": "RULE-UNILATERAL-TERMINATION",
                "severity": "High",
                "red_alert": True,
                "clause_text": "Tek taraflı fesih hakkı",
                "ai_reasoning": "Tek taraflı fesih, bildirim ve tazminat koşulu olmadan şirketi riske sokar.",
                "confidence_score": 97,
            })
        return findings

    def ask(self, user_message: str, timeout: Optional[float] = None, temperature: float = 0.2) -> str:
        """Genel amaçlı serbest operasyonel sohbet."""
        self._ensure_ready()

        if not user_message:
            return "Lütfen bir soru girin."

        try:
            instruction = (
                "Sen bir operasyonel AI asistanısın. Kendi öğrendiğin genel kalıpların üzerine değil, "
                "verilen gerçek duruma ve komuta göre özgün, net ve pratik cevap üret. "
                "Hiçbir zaman 'boşluk doldurma' veya hazır örnek tekrarı yapma. "
                "Eksik veri varsa tek, kısa soru sor. "
                "İstenen format varsa yalnızca o formata uygun cevap ver."
            )
            return self._complete([
                {"role": "system", "content": f"{MANTIS_PERSONA}\n\n{instruction}"},
                {"role": "user", "content": user_message},
            ], timeout=timeout, temperature=temperature)
        except Exception as exc:
            logger.error("Auditor sohbet hatası: %s", exc)
            return f"Bir sorun oluştu: {str(exc)}"

    def ask_stream(self, user_message: str):
        """Token streaming desteği."""
        self._ensure_ready()

        if not user_message:
            yield "Lütfen bir soru girin."
            return

        chat_prompt = f"{MANTIS_PERSONA}\n\nKullanıcı: {user_message}"
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": chat_prompt}],
            "stream": True,
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {FOUNDRY_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            stream_instruction = (
                "Özgün ve kısa cevap ver. Hazır kalıp cümleleri tekrar etme. "
                "Yalnızca verilen gerçek bilgiye göre karar ver; eksik bilgi varsa kısa soru sor."
            )
            with httpx.stream(
                "POST",
                f"{FOUNDRY_LOCAL_ENDPOINT.rstrip('/')}/chat/completions",
                json={
                    "model": self.model_name,
                    "messages": [{"role": "user", "content": f"{MANTIS_PERSONA}\n\n{stream_instruction}\n\nKullanıcı: {user_message}"}],
                    "stream": True,
                    "temperature": 0.2,
                },
                headers=headers,
                timeout=FOUNDRY_TIMEOUT_SECONDS,
            ) as response:
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[len("data: "):].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        continue
        except Exception as exc:
            logger.error("Foundry streaming hatası: %s", exc)
            yield f"\n[Hata: {exc}]"


# Geriye dönük uyumluluk
ContractAgent = Auditor