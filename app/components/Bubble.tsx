import { UIMessage } from "ai";

export default function Bubble({ message }: { message: UIMessage }) {
    return (
        <>{message}</>
    );
}