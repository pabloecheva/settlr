import Image from "next/image";
import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">OpenAI Chat Interface</h1>
      <ChatInterface />
    </div>
  );
}
