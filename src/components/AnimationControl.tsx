import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
} from "@tabler/icons-react";

export const AnimationControl = () => {
  return (
    <section
      className={`px-8 flex flex-row items-center justify-center gap-2 rounded-2xl text-neutral-900`}
    >
      {ANIMATION_TOOLS.map((tool, index) => (
        <button
          key={index}
          className={`flex items-center justify-center w-10 h-10 aspect-square bg-neutral-100 hover:bg-primary-600 rounded-full transition-all duration-300`}
        >
          {tool.icon}
        </button>
      ))}
    </section>
  );
};

const ANIMATION_TOOLS = [
  {
    name: "Previous Set",
    icon: <IconPlayerTrackPrevFilled size={20} />,
  },
  {
    name: "Previous Frame",
    icon: <IconPlayerSkipBackFilled size={20} />,
  },
  {
    name: "Play",
    icon: <IconPlayerPlayFilled size={20} />,
  },
  {
    name: "Next Frame",
    icon: <IconPlayerSkipForwardFilled size={20} />,
  },
  {
    name: "Next Set",
    icon: <IconPlayerTrackNextFilled size={20} />,
  },
];
