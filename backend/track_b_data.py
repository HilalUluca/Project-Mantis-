# track_b_data.py

AHMET_USTA_PROFILE = {
    "employee_id": "EMP-2024-089",
    "full_name": "Ahmet Yılmaz (Ahmet Usta)",
    "position": "Kıdemli Atölye / Üretim Ustası",
    "hire_date": "2023-03-15",
    "notification_period_weeks": 6,  # 3 yıldan az kıdem için İş Kanunu Madde 17 gereği 6 hafta ihbar süresi
    "status": "ABSENT",
    "absent_days": 2,
    "last_seen": "2026-08-22",
    "assigned_assets": ["Delik Makinesi Anahtar Seti", "Kurumsal Tablet (Tab-A8)", "Atölye Depo Kumandası"]
}

# İş Kanunu Madde 17 ve 25 İhtarname Şablonu
WARNING_LETTER_TEMPLATE = """
İHTARNAME / RESMİ BİLDİRİM

ŞİRKET: Project Mantis Üretim Atölyesi A.Ş.
MUHATAP: {employee_name} ({position})
SİCİL NO: {employee_id}
TARİH: {current_date}

KONU: 4857 Sayılı İş Kanunu'nun 25/II (Haklı Nedenle Fesih) ve Madde 17 İhbar Süreçleri Hakkında İhtar.

Sayın {employee_name},

Şirketimiz bünyesinde {hire_date} tarihinden bu yana yürütmekte olduğunuz görevinizle ilgili olarak;
1. 22.08.2026 ve 23.08.2026 tarihlerinde mazeretsiz ve izinsiz olarak işe gelmediğiniz tespit edilmiştir.
2. Durum puantaj kayıtlarına ve departman sorumlusu raporlarına işlenmiştir.

4857 Sayılı İş Kanunu'nun 25. maddesi II numaralı bendi uyarınca, işçinin ardı ardına iki işgünü veya bir ay içinde iki defa herhangi bir tatil gününden sonraki iş günü ya da bir ayda üç iş günü işe gelmemesi durumunda işverenin haklı fesih hakkı saklı bulunmaktadır. 

İş bu ihtarın tebliğinden itibaren 24 saat içinde geçerli bir mazeret bildirmediğiniz takdirde yasal işlemlerin ve iş sözleşmenizin fesih sürecinin başlatılacağını, üzerinizde bulunan demirbaş listesinin ({assets}) şirkete teslim edilmesi gerektiğini ihtar ederiz.

İşveren Vekili / İnsan Kaynakları & Hukuk Otomasyon Sistemi
"""