from abc import ABC, abstractmethod
from typing import Dict, Any

class ActionAdapter(ABC):
    """
    Project Mantis - Ortak Aksiyon Yönlendirici Arayüzü (Protocol/Abstract Class)
    Tüm aksiyon adaptörleri (Jira, SMTP/E-posta, Belge Üretici) bu sınıfı implemente eder.
    """
    
    @abstractmethod
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aksiyonu tetikler ve sonuç döner.
        """
        pass

class EmailAdapter(ActionAdapter):
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # SMTP / E-posta gönderme mantığı burada yer alacak
        print(f"[EmailAdapter] E-posta gönderiliyor... Alıcı: {payload.get('to')}")
        return {"status": "success", "channel": "email", "detail": "E-posta başarıyla iletildi."}

class JiraAdapter(ActionAdapter):
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Jira Issue açma mantığı burada yer alacak
        print(f"[JiraAdapter] Jira Issue açılıyor... Başlık: {payload.get('title')}")
        return {"status": "success", "channel": "jira", "detail": "Jira bileti oluşturuldu."}