export default function PromptSuggestionButton({ text, onClickHandler }: {
    text: string,
    onClickHandler: () => void;
}) {
    return (
        <button onClick={onClickHandler}>
            {text}
        </button>
    )
}