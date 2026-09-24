export default function LinkInativo({ className, children }) {
  return (
    <a href="#" className={className} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  );
}
