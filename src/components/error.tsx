import errorImage from "@/assets/error-fallback.png";

export default function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6">
      <img
        src={errorImage}
        alt="Error Illustration"
        className="max-w-md mb-6"
      />
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground">
        Please try again later or go back to the homepage.
      </p>
    </div>
  );
}