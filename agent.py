import autogen
import json
import re
import os

class ContractAgent:
    def __init__(self):
        self.model_name = os.getenv("FOUNDRY_LOCAL_MODEL", "Phi-3.5-mini-instruct")
        self.llm_config = {
            "config_list": [{"model": self.model_name, "base_url": os.getenv("FOUNDRY_LOCAL_ENDPOINT", "http://127.0.0.1:5272/v1"), "api_key": os.getenv("FOUNDRY_API_KEY", "foundry-local-key")}]
        }

        # Kurumsal Beyin dosyasını yükle (Corporate Brain)
        self.brain = self._load_corporate_brain()
        
        # Dinamik System Prompt (Brain'den gelen kurallar ve politikalarla beslenir)
        self.system_prompt = self._build_system_prompt()

        # 1. Cevap verecek Danışman Ajan
        self.agent = autogen.AssistantAgent(
            name="LegalAdvisor",
            system_message=self.system_prompt,
            llm_config=self.llm_config
        )

        # 2. Mesajı gönderecek Kullanıcı Ajanı
        self.user_proxy = autogen.UserProxyAgent(
            name="User",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=0,
            code_execution_config={"use_docker": False},
        )

    def _load_corporate_brain(self) -> dict:
        """corporate_brain.json dosyasını güvenli bir şekilde yükler."""
        brain_path = "corporate_brain.json"
        if os.path.exists(brain_path):
            try:
                with open(brain_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Uyarı: corporate_brain.json okunamadı: {e}")
        
        # Dosya yoksa varsayılan boş şablon döner
        return {
            "system_policy": "Sen kurumsal bir risk denetim ajanısın. Sadece JSON formatında yanıt ver.",
            "rules": [],
            "few_shot_examples": []
        }

    def _build_system_prompt(self) -> str:
        """Beyin dosyasındaki politika, kural ve örnekleri prompt'a işler."""
        policy = self.brain.get("system_policy", "")
        rules = json.dumps(self.brain.get("rules", []), ensure_ascii=False, indent=2)
        examples = json.dumps(self.brain.get("few_shot_examples", []), ensure_ascii=False, indent=2)

        example_json = """
        [
            {
                "risk_id": "string",
                "severity": "string (High, Medium, Low)",
                "clause_text": "string",
                "ai_reasoning": "string",
                "confidence_score": 100
            }
        ]
        """.strip()

        return f"""
        {policy}

        UYULMASI GEREKEN KURALLAR:
        {rules}

        ÖRNEK ANALİZLER (FEW-SHOT):
        {examples}

        ÇIKTI FORMATI:
        Yanıtın SADECE geçerli bir JSON formatında olmalıdır. Herhangi bir giriş, açıklama cümlesi veya Markdown metin KULLANMA. Doğrudan liste ile başla:
        {example_json}
        """

    def _parse_findings(self, content: str) -> list:
        """Model yanıtından JSON listesini çıkarır."""
        if not content:
            return []

        # ```json ... ``` bloğu varsa içeriği al
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
        raw = fenced.group(1) if fenced else content.strip()

        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict) and "findings" in parsed:
                return parsed["findings"]
        except json.JSONDecodeError:
            pass

        return []

    def analyze_text(self, document_text: str) -> dict:
        print(f"Agent {self.model_name} modeli ve corporate_brain kurallarıyla metni inceliyor...")

        self.user_proxy.initiate_chat(
            self.agent,
            message=f"Lütfen şu sözleşme metnini corporate_brain kurallarına göre analiz et ve sadece JSON dön:\n\n{document_text}",
        )

        messages = self.user_proxy.chat_messages.get(self.agent, [])
        if not messages:
            return {"findings": []}

        last_content = messages[-1].get("content", "")
        return {"findings": self._parse_findings(last_content)}

if __name__ == "__main__":
    agent = ContractAgent()
    result = agent.analyze_text("Taraflar istedikleri zaman hiçbir gerekçe göstermeden sözleşmeyi tek taraflı olarak feshedebilir.")
    print(json.dumps(result, ensure_ascii=False, indent=2))