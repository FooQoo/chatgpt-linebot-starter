import crypto from 'crypto';
import { LLMChain } from 'langchain';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';

const prompt = `あなたは質問者の質問に対して回答をする専門のスタッフです。
以下の文章に回答してください。なお、回答にはハッシュ値の「{hashValue}」を含めてください。
回答のフォーマットはJSONファイル形式で以下です。
{{
 "hash": "ハッシュ値", 
 "answer": "回答内容"
}}
質問者の質問は以下で、「====」の間に記載された文章です。
====
{userInput}
====`;

const model = new OpenAI();

export const chat = async (message: string): Promise<string> => {
  // ランダムな16バイトのソルトを生成する
  const salt = crypto.randomBytes(16).toString('hex');

  // パスワードとソルトを結合する
  const saltedMessage = message + salt;

  // SHA256ハッシュ関数を使用して、ソルトとパスワードを混ぜ合わせてハッシュ化する
  const hashedMessage = crypto
    .createHash('sha256')
    .update(saltedMessage)
    .digest('hex');

  const template = new PromptTemplate({
    inputVariables: ['userInput', 'hashValue'],
    template: prompt,
  });

  const chain = new LLMChain({
    prompt: template,
    llm: model,
  });

  const response = await chain.call({
    userInput: message,
    hashValue: hashedMessage,
  });

  const text: string = response.text;

  console.info(text);

  const { hash, answer } = JSON.parse(text);

  if (hash === hashedMessage) {
    return answer.trim();
  } else {
    return 'Unable to recognize. Please try again.';
  }
};
