import { UIMessage } from "ai";

export default function Bubble({ message }: { message: UIMessage }) {
    const{content,role}=message;
    // conditionally style bubble based on role user or ai
    return (
        <div>
            {content}
        </div>
    );
}