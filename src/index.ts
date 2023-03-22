import { Extension, HDirection, HMessage } from "gnode-api";
import { name, description, version, author } from "../package.json" assert { type: "json" };
import { Configuration, OpenAIApi } from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const PROMPT = "Kuvittele että olet William Shakespeare ja muotoile seuraava teksti:";
const MAX_TOKENS = 50;

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("No API key found");

  const ext = new Extension({ name, description, version, author });
  ext.run();

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const onChat = async (hMessage: HMessage) => {
    hMessage.blocked = true;
    const packet = hMessage.getPacket();
    const index = packet.readIndex;
    const message = packet.readString();

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${PROMPT} ${message}`,
      max_tokens: MAX_TOKENS,
    });

    if (!completion.data.choices[0].text) return;
    const reply = completion.data.choices[0].text.trim();
    packet.replaceString(index, reply);
    ext.sendToServer(packet);
  };

  ext.interceptByNameOrHash(HDirection.TOSERVER, "Chat", onChat);
  ext.interceptByNameOrHash(HDirection.TOSERVER, "Shout", onChat);
  ext.interceptByNameOrHash(HDirection.TOSERVER, "Whisper", onChat);
}
main().catch((err) => {
  if (err instanceof Error) {
    console.log(err);
    process.exit(1);
  }
});
