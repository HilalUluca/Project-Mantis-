import unittest


class FoundryLocalConfigTests(unittest.TestCase):
    def test_builder_defaults_to_foundry_local(self):
        import builder
        cfg = builder.Builder().llm_config
        self.assertEqual(cfg["config_list"][0]["base_url"], "http://127.0.0.1:5272/v1")

    def test_rag_embedding_defaults_to_foundry_local(self):
        import rag_pipeline
        self.assertTrue("127.0.0.1:5272" in rag_pipeline.DEFAULT_EMBEDDING_URL)


if __name__ == "__main__":
    unittest.main()
