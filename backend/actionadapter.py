import abc
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger("mantis.action_adapter")

# 1. ORTAK PROTOKOL
class ActionAdapter(abc.ABC):
    @abc.abstractmethod
    def dispatch_action(self, title: str, description: str, recipient: str) -> bool:
        pass


# 2. GERÇEK JIRA API ADAPTÖRÜ (Atlassian REST API)
class JiraAdapter(ActionAdapter):
    def __init__(self, base_url: str = "https://your-domain.atlassian.net", email: str = "your-email@domain.com", api_token: str = "your-jira-api-token", project_key: str = "MAN"):
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.api_token = api_token
        self.project_key = project_key

    def dispatch_action(self, title: str, description: str, recipient: str = "Legal-Team") -> bool:
        url = f"{self.base_url}/rest/api/3/issue"
        
        payload = {
            "fields": {
                "project": {
                    "key": self.project_key
                },
                "summary": title,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"Assigned Team: {recipient}\n\n{description}"
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {
                    "name": "Task"
                }
            }
        }

        try:
            # Gerçek Jira Cloud REST API kimlik doğrulaması (Basic Auth)
            response = requests.post(
                url,
                json=payload,
                auth=(self.email, self.api_token),
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"[JIRA API] Bilet başarıyla oluşturuldu! Key: {response.json().get('key')}")
                return True
            else:
                logger.error(f"Jira API Hatası [{response.status_code}]: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Jira bağlantı istisnası: {str(e)}")
            return False


# 3. GERÇEK SMTP E-POSTA ADAPTÖRÜ
class EmailAdapter(ActionAdapter):
    def __init__(self, smtp_server: str = "smtp.gmail.com", port: int = 587, sender_email: str = "your-email@gmail.com", sender_password: str = "your-app-password"):
        self.smtp_server = smtp_server
        self.port = port
        self.sender_email = sender_email
        self.sender_password = sender_password

    def dispatch_action(self, title: str, description: str, recipient: str = "hilal@mantis.corp") -> bool:
        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = recipient
            msg['Subject'] = f"[Project Mantis Alert] {title}"
            
            body = f"Kritik Uyarı ve Risk Gerekçesi:\n\n{description}\n\n---\nProject Mantis Autonomous Legal Engine"
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            # TLS üzerinden güvenli SMTP bağlantısı
            server = smtplib.SMTP(self.smtp_server, self.port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.text = msg.as_string()
            server.sendmail(self.sender_email, recipient, msg.as_string())
            server.quit()

            logger.info(f"[SMTP EMAIL] E-posta başarıyla {recipient} adresine gönderildi.")
            return True
        except Exception as e:
            logger.error(f"SMTP e-posta gönderim hatası: {str(e)}")
            return False