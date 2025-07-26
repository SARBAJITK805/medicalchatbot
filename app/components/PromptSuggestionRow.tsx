import PromptSuggestionButton from "./PromptSuggestionButton"

export default function PromptSuggestionRow({ onClickHandler }: {
    onClickHandler: (promptText: string) => void
}) {
    const prompts: string[] = [
        "Describe the symptoms and possible causes of a persistent cough.",
        "Explain the steps involved in diagnosing diabetes.",
        "List common treatments for high blood pressure.",
        "Summarize the differences between viral and bacterial infections.",
        "Discuss the importance of vaccination in public health."
    ]
    return (
        <div>
            {prompts.map((prompt, index) =>
                <PromptSuggestionButton key={index} text={prompt} onClickHandler={() => onClickHandler(prompt)} />
            )}
        </div>
    )
}