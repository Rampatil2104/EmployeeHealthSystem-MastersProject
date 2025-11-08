export default function ErrorBox({ error }) {
  return (
    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
      {error?.message || "Something went wrong."}
    </div>
  );
}
