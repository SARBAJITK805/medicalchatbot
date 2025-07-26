import { useChat } from "@ai-sdk/react";
import { Message } from "ai"
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";


export default function Home() {
  const { messages, append, isLoading, input, handleInputChange, handleSubmit } = useChat()
  const onMessage = true;
  return (
    <main>
      {/* image */}
      <section>
        {onMessage ? (<>
          <p>The ultimate platform for medical advice We hope you enjoy</p>
          <br />
          <PromptSuggestionRow />
        </>
        ) : (
          <>
            {messages.map((message,index) => {
              <Bubble key={index} message={message} />
            })}
            {isLoading && <LoadingBubble />}
          </>)}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Ask me something" value={input} onChange={handleInputChange} />
          <input type="submit" />
        </form>
      </section>
    </main>
  )
}
