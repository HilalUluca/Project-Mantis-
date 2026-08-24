import time
import json
import ollama
#benchmark kıyaslama verileri, model seçimini bu testler sonrası yaptık.
MODELS = ["phi4", "qwen2.5"]
TEST_FILE = "test_contracts.json"

def run_benchmark():
    with open(TEST_FILE, "r", encoding="utf-8") as f:
        contracts = json.load(f)

    results = []

    for model in MODELS:
        print(f"\n--- Testing Model: {model} ---")
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
                response = ollama.chat(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    options={"temperature": 0.1}
                )
                duration = time.time() - start_time
                content = response['message']['content']
                
                print(f"[{contract['id']}] Latency: {duration:.2f}s | Success")
                results.append({
                    "model": model,
                    "contract_id": contract['id'],
                    "latency": duration,
                    "output": content
                })
            except Exception as e:
                print(f"[{contract['id']}] Error with {model}: {e}")

    # Save benchmark results
    with open("benchmark_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)
    print("\nBenchmark completed! Results saved to benchmark_results.json.")

if __name__ == "__main__":
    run_benchmark()