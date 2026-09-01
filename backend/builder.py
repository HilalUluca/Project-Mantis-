import json
import os
import re
import autogen
from typing import Dict, Any

class Builder:
    def __init__(self, model_name: str = None) -> None:
        self.model_name = model_name or os.getenv("FOUNDRY_LOCAL_MODEL", "Phi-3.5-mini-instruct")
        self.llm_config: Dict[str, Any] = {
            "config_list": [{
                "model": self.model_name,
                "base_url": os.getenv("FOUNDRY_LOCAL_ENDPOINT", "http://127.0.0.1:5272/v1"),
                "api_key": os.getenv("FOUNDRY_API_KEY", "foundry-local-key")
            }]
        }

        self.system_prompt = """
        Sen uzman bir Kurumsal Sözleşme Mimarısın (Agent 3 - Builder).
        Görevin, sana iletilen riskli sözleşme maddelerini inceleyerek şirketin çıkarlarını koruyan, hukuki olarak tutarlı ve düzeltilmiş (Redline) yeni bir taslak metin üretmektir.

        ÇIKTI FORMATI:
        Yanıtın SADECE geçerli bir JSON nesnesi olmalıdır. Markdown dışında açıklama yazma:
        {
            "status": "success",
            "revised_summary": "Yapılan düzeltmelerin kısa özeti",
            "redlined_clause": "Şirket kurallarına uygun olarak yeniden yazılmış güvenli madde metni"
        }
        """

        self.agent = autogen.AssistantAgent(
            name="ContractBuilder",
            system_message=self.system_prompt,
            llm_config=self.llm_config
        )

        self.user_proxy = autogen.UserProxyAgent(
            name="UserProxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=0,
            code_execution_config={"use_docker": False},
        )

    def generate_redline(self, original_clause: str, reasoning: str) -> Dict[str, Any]:
        if not original_clause:
            return {"status": "error", "revised_summary": "Metin yok", "redlined_clause": ""}

        prompt = f"""
        Riskli Orijinal Madde: {original_clause}
        Denetim Notu / Neden Riskli?: {reasoning}

        Lütfen bu maddeyi şirket lehine, sorumluluğu sınırlayan veya ihbar süresini 30 güne çıkaran güvenli bir formata dönüştür.
        """

        try:
            self.user_proxy.initiate_chat(
                self.agent,
                message=prompt,
                clear_history=True
            )
            messages = self.user_proxy.chat_messages.get(self.agent, [])
            if not messages:
                return {"status": "error", "revised_summary": "Yanıtsız", "redlined_clause": original_clause}

            content = messages[-1].get("content", "")
            fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
            raw = fenced.group(1) if fenced else content.strip()
            
            return json.loads(raw)
        except Exception as e:
            return {
                "status": "error",
                "revised_summary": f"Builder Hatası: {str(e)}",
                "redlined_clause": original_clause
            }