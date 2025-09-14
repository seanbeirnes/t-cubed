export function InfoBlurb() {
  return (
    <div className="flex items-center justify-center text-xs text-slate-300/80 mt-2">
      <span className="px-4 py-1 rounded-full bg-slate-700/60 outline-1 outline-slate-600">
        Numbers indicate the ranking of the neural net's suggested moves. 1 is the best move, 9 is the worst.
      </span>
    </div>
  );
}

export default InfoBlurb;
