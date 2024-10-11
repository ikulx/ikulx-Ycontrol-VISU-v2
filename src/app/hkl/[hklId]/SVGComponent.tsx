import React from 'react';

interface SVGComponentProps {
  data: DataItem[];
  handleButtonClick: (param: DataItem) => void;
}

export const SVGComponent: React.FC<SVGComponentProps> = ({ data, handleButtonClick }) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 818 458"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <g id="Frame 15315">
        <rect width="818" height="458" fill="black" />

        <g id="Frame 8">
          {/* Buttons für Felder 1 bis 6 */}
          {data.map((param) => (
            <g
              key={param.id}
              onClick={() => handleButtonClick(param)}
              style={{ cursor: "pointer" }}
            >
              <rect x="8" y="90" width="40" height="30" fill="#3a485e" />
              <text
                x="14"
                y="110"
                fill="white"
                fontSize="12"
                fontFamily="Arial"
              >
                {param.VAR_VALUE} {param.unit}
              </text>
            </g>
          ))}
        </g>

        {/* Bedingtes Rendering für "Freigabe Kühlen" */}
        {data.find((param) => param.HKL_Feld === "20")?.VAR_VALUE !== "1" && (
          <g id="Freigabe Kühlen">
            <rect x="276" y="290" width="46" height="7" fill="#2196F3" />
            <path d="M254 293.5L277.25 280.077V306.923L254 293.5Z" fill="#2196F3" />
            <text x="264" y="316.864" fill="white" fontSize="12">
              Freigabe Kühlen
            </text>
          </g>
        )}
        {/* Weitere SVG Elemente */}
      </g>
    </svg>
  );
};
