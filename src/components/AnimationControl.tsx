import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
} from "@tabler/icons-react";

const ANIMATION_TOOLS = [
  {
    name: "Previous Set",
    icon: <IconPlayerTrackPrevFilled size={18} />,
  },
  {
    name: "Previous Frame",
    icon: <IconPlayerSkipBackFilled size={18} />,
  },
  {
    name: "Play",
    icon: <IconPlayerPlayFilled size={18} />,
  },
  {
    name: "Next Frame",
    icon: <IconPlayerSkipForwardFilled size={18} />,
  },
  {
    name: "Next Set",
    icon: <IconPlayerTrackNextFilled size={18} />,
  },
];

const AnimationControl = () => {
  return (
    <section
      className={`pointer-events-none flex flex-col items-end justify-end gap-1 w-10 rounded-2xl text-neutral-900 bg-neutral-100`}
    >
      {ANIMATION_TOOLS.map((tool, index) => (
        <button
          key={index}
          className={`pointer-events-auto flex items-center justify-center w-10 aspect-square bg-neutral-100 hover:bg-primary-600 rounded-2xl transition-all duration-300`}
        >
          {tool.icon}
        </button>
      ))}
    </section>
  );
};

export default AnimationControl;
