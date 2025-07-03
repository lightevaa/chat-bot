// FloatingSupportButton.jsx
const FloatingSupportButton = ({ onClick }) => {
    return (
      <button
        onClick={onClick}
        className="fixed bottom-20 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
        title="Support"
      >
        💬
      </button>
    );
  };
  
  export default FloatingSupportButton;
  