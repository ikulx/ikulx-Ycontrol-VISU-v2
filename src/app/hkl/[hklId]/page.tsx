"use client"

import { useState, useEffect } from "react";
import { Modal, Input, Dropdown, Button, Spin } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useParams } from 'next/navigation';
import { VirtualKeyboard } from "./VirtualKeyboard"; // Assuming you have this component

interface DataItem {
  id: number;
  NAME: string;
  VAR_VALUE: string | number;
  unit: string | null;
  HKL_Feld: string;
  MIN?: number;
  MAX?: number;
  OPTI?: string; // Options string in the format "1:Option1,2:Option2,3:Option3"
}

export default function HklPage() {
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedParam, setSelectedParam] = useState<DataItem | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<{ key: string; label: string }[]>([]);
  const [newValue, setNewValue] = useState<string>(""); // Ensuring this is a string
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false); // Flag for editing state
  
  const params = useParams();
  const hklId = params.hklId;

  // Function to fetch the data
  const fetchData = () => {
    fetch(`/api/hkl/${hklId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setData(data);

          // Only update newValue if we are not in editing mode
          if (!isEditing) {
            const param30 = data.find((param) => param.HKL_Feld === "30");
            if (param30) {
              fetchDropdownOptions(param30);
              setNewValue(param30.VAR_VALUE?.toString() ?? ""); // Fallback if VAR_VALUE is undefined
            }
          }
        } else {
          console.error("Parameter data is invalid:", data);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  // Fetch data when component mounts and set interval to update every 5 seconds
  useEffect(() => {
    fetchData(); // Initial fetch

    const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [hklId, isEditing]);

  // Fetch dropdown options dynamically from OPTI field
  const fetchDropdownOptions = (param: DataItem) => {
    if (param.OPTI) {
      const options = param.OPTI.split(",").map((opt) => {
        const [key, label] = opt.split(":");
        return { key, label };
      });
      setDropdownOptions(options);
    }
  };

  const handleButtonClick = (param: DataItem) => {
    setSelectedParam(param);
    setNewValue(param.VAR_VALUE?.toString() ?? ""); // Ensuring the value is a string
    setIsEditing(true);  // Enter editing mode
    setIsModalVisible(true);
  };

  const handleDropdownButtonClick = (param: DataItem) => {
    setSelectedParam(param);
    setNewValue(param.VAR_VALUE?.toString() ?? ""); // Fallback if VAR_VALUE is undefined
    setIsEditing(true);  // Enter editing mode
    setIsDropdownVisible(true);
    setLoadingOptions(true);

    // Fetch dropdown options
    fetchDropdownOptions(param);
    setLoadingOptions(false);
  };

  const handleDropdownSelect: MenuProps['onClick'] = ({ key }) => {
    setNewValue(key); // Set the new value when an option is selected
    setIsDropdownVisible(false);  // Close the dropdown
    setIsEditing(false);  // Exit editing mode after selection

    if (selectedParam) {
      // Save the new selected value to the backend
      fetch(`/api/editor/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedParam.id, VAR_VALUE: key }),
      })
        .then(() => {
          setData((prevData) =>
            prevData.map((item) =>
              item.id === selectedParam.id ? { ...item, VAR_VALUE: key } : item
            )
          );
        })
        .catch((error) => console.error("Error saving:", error));
    }
  };

  const handleSave = () => {
    if (selectedParam) {
      fetch(`/api/editor/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedParam.id, VAR_VALUE: newValue }),
      })
        .then(() => {
          setData((prevData) =>
            prevData.map((item) =>
              item.id === selectedParam.id
                ? { ...item, VAR_VALUE: newValue }
                : item
            )
          );
          setIsModalVisible(false);
          setIsEditing(false);  // Exit editing mode
        })
        .catch((error) => console.error("Error saving:", error));
    }
  };

  const getOptionLabel = (value: string) => {
    const option = dropdownOptions.find((opt) => opt.key === value);
    return option ? option.label : value;
  };

  const renderButton = (fieldNumber: string, x: number, y: number, width: number, height: number) => {
    const param = data.find((param) => param.HKL_Feld === fieldNumber);
    if (!param) return null;

    return (
      <g onClick={() => handleButtonClick(param)} style={{ cursor: "pointer" }}>
        <rect x={x} y={y} width={width} height={height} fill="#3a485e" />
        <text x={x + 6} y={y + 20} fill="white" fontSize="12" fontFamily="Arial">
          {getOptionLabel(param.VAR_VALUE?.toString() ?? "") || `Feld${fieldNumber}`} {param.unit || ""}
        </text>
      </g>
    );
  };

  const menuItems: MenuProps['items'] = dropdownOptions.map((opt) => ({
    key: opt.key,
    label: opt.label,
  }));

  const menu: MenuProps = {
    items: menuItems,
    onClick: handleDropdownSelect, // Handle selection in the Menu object
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0px",
        margin: "0px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
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

          {/* Buttons for fields */}
          <g id="Frame 8">
            {renderButton("1", 8, 90, 40, 30)} {/* Button for Feld1 */}
            {renderButton("2", 8, 289, 40, 30)} {/* Button for Feld2 */}
            {renderButton("3", 199, 405, 40, 30)} {/* Button for Feld3 */}
            {renderButton("4", 403, 405, 40, 30)} {/* Button for Feld4 */}
            {renderButton("5", 580, 405, 40, 30)} {/* Button for Feld5 */}

            {/* Button for Feld6 */}
            {data.find((param) => param.HKL_Feld === "20")?.VAR_VALUE !== "0" && (
              <g onClick={() => handleButtonClick(data.find((param) => param.HKL_Feld === "6")!)} style={{ cursor: "pointer" }}>
                <rect x="355" y="290" width="40" height="30" fill="#3a485e" />
                <text x="360" y="310" fill="white" fontSize="12" fontFamily="Arial">
                  {data.find((param) => param.HKL_Feld === "6")?.VAR_VALUE || "Feld6"}{" "}
                  {data.find((param) => param.HKL_Feld === "6")?.unit || ""}
                </text>
              </g>
            )}

            {/* New Button with Dropdown (Parameter 30) */}
            {data.find((param) => param.HKL_Feld === "30") && (
              <g onClick={() => handleDropdownButtonClick(data.find((param) => param.HKL_Feld === "30")!)} style={{ cursor: "pointer" }}>
                <rect x="650" y="190" width="115" height="30" fill="#3a485e" />
                <text x="656" y="210" fill="white" fontSize="12" fontFamily="Arial">
                  {getOptionLabel(data.find((param) => param.HKL_Feld === "30")?.VAR_VALUE?.toString() ?? "") || "Parameter 30"}
                </text>
              </g>
            )}
            <text
                  id="TotbandLabel"
                  fill="white"
                  fontSize="12"
                  fontFamily="Arial"
                  letterSpacing="0em"
                >
                  <tspan x="650" y="184">
                    Betriebsmodus
                  </tspan>
                </text>

            {/* VL Min */}
            {data.find((param) => param.HKL_Feld === "10") && (
              <text x="256" y="61.8636" fill="white" fontSize="12" fontFamily="Arial">
                VL Min: {data.find((param) => param.HKL_Feld === "10")?.VAR_VALUE} {data.find((param) => param.HKL_Feld === "10")?.unit || ""}
              </text>
            )}

            {/* VL Max */}
            {data.find((param) => param.HKL_Feld === "11") && (
              <text x="411" y="61.8636" fill="white" fontSize="12" fontFamily="Arial">
                VL Max: {data.find((param) => param.HKL_Feld === "11")?.VAR_VALUE} {data.find((param) => param.HKL_Feld === "11")?.unit || ""}
              </text>
            )}

            {/* Kühlen */}
            {data.find((param) => param.HKL_Feld === "20")?.VAR_VALUE !== "0" && (
              <g id="Freigabe Kühlen">
                <rect
                  id="Rectangle 1"
                  x="276"
                  y="290"
                  width="46"
                  height="7"
                  fill="#2196F3"
                />
                <path
                  id="Polygon 2"
                  d="M254 293.5L277.25 280.077V306.923L254 293.5Z"
                  fill="#2196F3"
                />
                <text
                  id="Freigabe Kühlen Text"
                  fill="white"
                  fontSize="12"
                  fontFamily="Arial"
                >
                  <tspan x="264" y="316.864">
                    Freigabe
                  </tspan>
                  <tspan x="264" y="331.864">
                    Kühlen
                  </tspan>
                </text>
                <g id="Totband">
                <path
                  id="TotbandPath"
                  d="M323.004 396.131V231.985"
                  stroke="white"
                  strokeWidth="3"
                  strokeMiterlimit="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  id="TotbandLabel"
                  fill="white"
                  fontSize="12"
                  fontFamily="Arial"
                  letterSpacing="0em"
                >
                  <tspan x="353" y="285">
                    Totband
                  </tspan>
                </text>
              </g>
              </g>
              
            )}


<g id="Group">
<path id="Vector_2" d="M54 67.3107L54 396.124" stroke="white" strokeMiterlimit="3" strokeLinecap="round" strokeLinejoin="round"/>
<path id="Vector_3" d="M54.0042 396.133H787.231" stroke="white" strokeMiterlimit="3" strokeLinecap="round" strokeLinejoin="round"/>
<path id="Vector_4" d="M152.273 362.117C322.877 203.831 537.875 101.608 768.331 69.2062" stroke="white" strokeWidth="1.33333" strokeMiterlimit="3" strokeLinecap="square" strokeDasharray="7 7"/>
<path id="Vector_5" d="M425.398 174.472C532.737 121.583 647.822 86.1437 766.32 69.4891" stroke="white" strokeWidth="3" strokeMiterlimit="3" strokeLinecap="round" strokeLinejoin="round"/>
<path id="Vector_6" d="M425.714 174.311L425.717 396.124" stroke="white" strokeWidth="3" strokeMiterlimit="3" strokeLinecap="round" strokeLinejoin="round"/>
<path id="Vector_7" d="M425.153 396.125L125.82 396.125" stroke="white" strokeWidth="3" strokeMiterlimit="3" strokeLinecap="round" strokeLinejoin="round"/>
<path id="Vector_8" d="M220.903 303.324H54.0095" stroke="white" strokeWidth="1.33333" strokeMiterlimit="3" strokeLinecap="square" strokeDasharray="3 3"/>
<path id="Vector_9" d="M221.289 396.129L221.255 303.049" stroke="white" strokeWidth="1.33333" strokeMiterlimit="3" strokeLinecap="square" strokeDasharray="3 3"/>
<path id="Vector_10" d="M602.516 105.277L54.0087 105.105" stroke="white" strokeWidth="1.33333" strokeMiterlimit="3" strokeLinecap="square" strokeDasharray="3 3"/>
<path id="Vector_11" d="M599.394 396.129V105.102" stroke="white" strokeWidth="1.33333" strokeMiterlimit="3" strokeLinecap="square" strokeDasharray="3 3"/>
</g>
<g id="Freigabe Heizen">
<rect id="Rectangle 1_2" x="428" y="288" width="47" height="7" fill="#FD2B2B"/>
<path id="Polygon 2_2" d="M497 291.5L473.75 304.923V278.077L497 291.5Z" fill="#FD2B2B"/>
<text id="Freigabe Heizen_2" fill="white"  fontSize="12" ><tspan x="441" y="314.864">Freigabe&#10;</tspan><tspan x="441" y="329.864">Heizen</tspan></text>
</g>
              
            
          </g>
        </g>
      </svg>

      {/* Modal for editing parameter values */}
      <Modal

        title={selectedParam?.NAME}
        open={isModalVisible} // Using open instead of visible
        onCancel={() => {
          setIsModalVisible(false);
          setIsEditing(false); // Exit editing mode when modal is closed
        }}
        onOk={handleSave}
      >
        <p>
          Min: {selectedParam?.MIN}, Max: {selectedParam?.MAX}
        </p>
        <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} />
        <VirtualKeyboard
          onInput={(input: string) => setNewValue(newValue + input)}
          onDelete={() => setNewValue(newValue.slice(0, -1))}  // Added onDelete handler
        />
      </Modal>

      {/* Dropdown Popup */}
      <Modal
        title="Betriebsmodus"
        open={isDropdownVisible} // Using open instead of visible
        onCancel={() => {
          setIsDropdownVisible(false);
          setIsEditing(false); // Exit editing mode when dropdown is closed
        }}
        footer={null}
      >
        {loadingOptions ? (
          <Spin />
        ) : (
          // Ensure that Dropdown receives a single Button as its child
          <Dropdown menu={menu} trigger={['click']}>
            {/* Single Button as the child of Dropdown */}
            <Button>
              {getOptionLabel(newValue) || "Select an option"} <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </Modal>
    </div>
  );
}
