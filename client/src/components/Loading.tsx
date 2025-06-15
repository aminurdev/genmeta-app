export const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-muted-foreground tracking-widest mb-4">Loading</p>
      <div className="flex w-20 items-center justify-center">
        <div className="load bg-primary mx-0.5 rounded-sm" />
        <div className="load bg-primary mx-0.5 rounded-sm" />
        <div className="load bg-primary mx-0.5 rounded-sm" />
        <div className="load bg-primary mx-0.5 rounded-sm" />
      </div>

      <style>
        {`
          .load {
            width: 23px;
            height: 3px;
            animation: move_5011 1s infinite;
          }

          .load:nth-child(1) {
            animation-delay: 0.2s;
          }

          .load:nth-child(2) {
            animation-delay: 0.4s;
          }

          .load:nth-child(3) {
            animation-delay: 0.6s;
          }

          .load:nth-child(4) {
            animation-delay: 0.8s;
          }

          @keyframes move_5011 {
            0% {
              width: 0.5em;
            }

            25% {
              width: 0.9em;
            }

            50% {
              width: 1.5em;
            }

            100% {
              width: 0.5em;
            }
          }
        `}
      </style>
    </div>
  );
};
