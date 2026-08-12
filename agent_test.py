import asyncio
from agent_framework import Agent

async def main():
    # Client argümanını (istemciyi) sağlayarak ajanı ayağa kaldırıyoruz
    agent = Agent(
        name="MantisGuard",
        instructions="Sen kıdemli bir sözleşme denetim ve risk analiz uzmanısın.",
        client=None # Geçici olarak istemci yer tutucusu
    )
    print(f"Ajan başarıyla oluşturuldu: {agent.name}")

if __name__ == "__main__":
    asyncio.run(main())