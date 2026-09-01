import os.path
import json
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
LOCAL_LLM_URL = "http://localhost:5272/v1/chat/completions" # Foundry Local varsayılan endpoint'i

def get_gmail_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)

def analyze_email_with_foundry(subject: str, sender: str, snippet: str) -> dict:
    """
    Mail içeriğini Foundry Local'e gönderir ve yapılandırılmış JSON kararı alır.
    """
    prompt = f"""Sen kurumsal bir yönetici asistanısın. Gelen e-postayı analiz et ve SADECE aşağıdaki JSON formatında yanıt dön:
{{
  "importance": "Yüksek" | "Orta" | "Düşük" | "Spam",
  "has_task": true | false,
  "task_title": "Görev varsa kısa aksiyon başlığı, yoksa null",
  "deadline": "YYYY-MM-DD veya null",
  "confidence": 0.0 ile 1.0 arasında float,
  "summary": "Mailin tek cümlelik Türkçe özeti"
}}

E-POSTA:
Gönderen: {sender}
Konu: {subject}
İçerik Özeti: {snippet}
"""
    try:
        # Foundry Local / Yerel LLM çağrısı
        payload = {
            "model": "phi-3.5-mini", # veya yerelde yüklü model adın
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        response = requests.post(LOCAL_LLM_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            # JSON bloğunu temizle ve ayrıştır
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
    except Exception:
        # Foundry henüz ayakta değilse defansif kural tabanlı fallback
        pass

    # Model erişilemezse kural tabanlı acil durum filtrelemesi
    is_spam = "newsletter" in sender.lower() or "noreply" in sender.lower()
    is_action = "onay" in subject.lower() or "ihtar" in subject.lower()
    
    return {
        "importance": "Spam" if is_spam else ("Yüksek" if is_action else "Orta"),
        "has_task": is_action,
        "task_title": f"Aksiyon alınacak: {subject}" if is_action else None,
        "deadline": "2026-08-28" if is_action else None,
        "confidence": 0.85 if is_action else 0.40,
        "summary": snippet[:80] + "..." if snippet else "Özet yok"
    }

def process_inbox_and_route():
    service = get_gmail_service()
    results = service.users().messages().list(userId='me', maxResults=5, labelIds=['INBOX']).execute()
    messages = results.get('messages', [])

    if not messages:
        print("Gelen kutusunda mail bulunamadı.")
        return

    task_list = []
    approval_queue = []

    print(f"\n==================== MANTIS MAIL ZEKA KATMANI ====================")
    for msg in messages:
        txt = service.users().messages().get(userId='me', id=msg['id']).execute()
        headers = txt['payload']['headers']
        
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "Konu Yok")
        sender = next((h['value'] for h in headers if h['name'] == 'From'), "Bilinmeyen Gönderen")
        snippet = txt.get('snippet', '')
        
        # Karar Katmanı
        decision = analyze_email_with_foundry(subject, sender, snippet)
        
        print(f"\n[E-POSTA] {sender} | {subject}")
        print(f"-> Önem Derecesi: {decision['importance']} | Güven Skoru: {decision['confidence']}")
        print(f"-> Özet: {decision['summary']}")

        # Blueprint Kuralı: Confidence Eşiği ve Yönlendirme
        if decision.get("has_task"):
            task_obj = {
                "id": msg['id'],
                "title": decision.get("task_title"),
                "deadline": decision.get("deadline"),
                "sender": sender,
                "confidence": decision.get("confidence")
            }
            if decision["confidence"] > 0.75:
                task_list.append(task_obj)
                print(f"  [+] OTO-TASK OLUŞTURULDU: {task_obj['title']}")
            else:
                approval_queue.append(task_obj)
                print(f"  [?] ONAY BEKLİYOR (Düşük Güven): {task_obj['title']}")
        else:
            print("  [-] Aksiyon gerekmiyor (Bilgilendirme/Bülten).")

    print(f"\n==================== GÜNÜN BRİFİNG RAPORU ====================")
    print(f"• Toplam Taranan: {len(messages)}")
    print(f"• Otomatik Eklenen Görevler: {len(task_list)}")
    print(f"• Kullanıcı Onayı Bekleyenler: {len(approval_queue)}")

if __name__ == '__main__':
    process_inbox_and_route()