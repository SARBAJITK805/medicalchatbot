interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

export default function Bubble({ message }: { message: Message }) {
  const { content, role } = message;
  
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
        role === 'user' 
          ? 'bg-blue-600 text-white rounded-br-sm' 
          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
      }`}>
        {role === 'assistant' && (
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-600">MEDIC</span>
          </div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}