import Image from "next/image";

const SRC = "/proof-icon.png";
const WIDTH = 960;
const HEIGHT = 992;

type AppLogoProps = {
  className?: string;
  /** Rendered height in px; width follows asset aspect ratio. */
  height?: number;
  priority?: boolean;
};

export function AppLogo({
  className,
  height = 40,
  priority = false,
}: AppLogoProps) {
  const width = Math.round((height * WIDTH) / HEIGHT);

  return (
    <Image
      src={SRC}
      alt="PRoof"
      width={width}
      height={height}
      className={className ?? "w-auto"}
      style={{ height, width: "auto" }}
      priority={priority}
    />
  );
}
