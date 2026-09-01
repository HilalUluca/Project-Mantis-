import time
import json
import os
import httpx

MODEL = os.getenv("FOUNDRY_LOCAL_MODEL", "Phi-3.5-mini-instruct")
ENDPOINT = os.getenv("FOUNDRY_LOCAL_ENDPOINT", "http://127.0.0.1:5272/v1")
API_KEY = os.getenv("FOUNDRY_API_KEY", "foundry-local-key")
TEST_FILE = "test_contracts.json"


def run_benchmark():
    with open(TEST_FILE, "r", encoding="utf-8") as f:
        contracts = json.load(f)

    results = []

    print(f"\n--- Testing Foundry Local Model: {MODEL} ---")
    for contract in contracts:
        prompt = f"""
        Sen kurumsal bir hukuk asistanısın. Aşağıdaki sözleşme maddesini analiz et ve riskleri bul.
        Sadece şu JSON formatında yanıt ver:
        {{
          "contract_id": "{contract['id']}",
          "risk_score": "Yüksek/Orta/Düşük",
          "identified_risks": ["risk 1", "risk 2"]
        }}

        Sözleşme Metni: {contract['text']}
        """

        start_time = time.time()
        try:
            response = httpx.post(
                f"{ENDPOINT.rstrip('/')}/chat/completions",
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                },
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                timeout=60.0,
            )
            response.raise_for_status()
            duration = time.time() - start_time
            content = response.json()["choices"][0]["message"]["content"]

            print(f"[{contract['id']}] Latency: {duration:.2f}s | Success")
            results.append({
                "model": MODEL,
                "contract_id": contract['id'],
                "latency": duration,
                "output": content,
            })
        except Exception as e:
            print(f"[{contract['id']}] Error with {MODEL}: {e}")

    with open("benchmark_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)
    print("\nBenchmark completed! Results saved to benchmark_results.json.")


if __name__ == "__main__":
    run_benchmark()