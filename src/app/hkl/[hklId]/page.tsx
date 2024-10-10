"use client";

// button1 = VL Auslegepunkt
// button2 = VL Fusspunkt
// button3 = AT Auslegepunkt
// button4 = Hiezgrenze
// button5 = AT Fusspunkt

// ID 10 = VL MIN
// ID 11 = VL MAX

import { useState, useEffect } from "react";
import { Card, Modal, Input } from "antd";
import { useSearchParams } from "next/navigation";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { after } from "node:test";
import { AlipaySquareFilled } from "@ant-design/icons";

interface DataItem {
  id: number;
  NAME: string;
  VAR_VALUE: string | number;
  unit: string | null;
  HKL_Feld: string;
  MIN?: number;
  MAX?: number;
}

export default function HklPage() {
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedParam, setSelectedParam] = useState<DataItem | null>(null);
  const [newValue, setNewValue] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const searchParams = useSearchParams();
  const hklId = searchParams.get("hklId") || "1";

  useEffect(() => {
    // Fetch data for specific HKL page
    fetch(`/api/hkl/${hklId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        if (Array.isArray(data) && data.length > 0) {
          setData(data);
        } else {
          console.error("Parameter data is invalid:", data);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [hklId]);

  const handleButtonClick = (param: DataItem) => {
    if (!param) {
      console.error("Invalid parameter:", param);
      return;
    }
    setSelectedParam(param);
    setNewValue(param.VAR_VALUE.toString());
    setIsModalVisible(true);
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
        })
        .catch((error) => console.error("Error saving:", error));
    }
  };

  const handleKeyboardInput = (input: string) => {
    setNewValue((prev) => prev + input);
  };

  const handleDeleteInput = () => {
    setNewValue((prev) => prev.slice(0, -1));
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Card style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* Responsive SVG with buttons */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 818 418"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", top: 0, left: 0 }}
          preserveAspectRatio="xMidYMid meet"
        >
          <g id="Frame 15315">
            <rect width="818" height="458" fill="black" />
            {/* Other SVG elements here */}
            <g id="Frame 8">
              {/* Button for Feld1 */}
              {data.find((param) => param.HKL_Feld === "1") && (
                <g
                  onClick={() =>
                    handleButtonClick(
                      data.find((param) => param.HKL_Feld === "1")!
                    )
                  }
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
                    {data.find((param) => param.HKL_Feld === "1")?.VAR_VALUE ||
                      "Feld1"}{" "}
                    {data.find((param) => param.HKL_Feld === "1")?.unit || ""}
                  </text>
                </g>
              )}

              {/* Button for Feld2 */}
              {data.find((param) => param.HKL_Feld === "2") && (
                <g
                  onClick={() =>
                    handleButtonClick(
                      data.find((param) => param.HKL_Feld === "2")!
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <rect x="8" y="289" width="40" height="30" fill="#3a485e" />
                  <text
                    x="14"
                    y="309"
                    fill="white"
                    fontSize="12"
                    fontFamily="Arial"
                  >
                    {data.find((param) => param.HKL_Feld === "2")?.VAR_VALUE ||
                      "Feld2"}{" "}
                    {data.find((param) => param.HKL_Feld === "2")?.unit || ""}
                  </text>
                </g>
              )}

              {/* Button for Feld3 */}
              {data.find((param) => param.HKL_Feld === "3") && (
                <g
                  onClick={() =>
                    handleButtonClick(
                      data.find((param) => param.HKL_Feld === "3")!
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <rect x="199" y="405" width="40" height="30" fill="#3a485e" />
                  <text
                    x="205"
                    y="425"
                    fill="white"
                    fontSize="12"
                    fontFamily="Arial"
                  >
                    {data.find((param) => param.HKL_Feld === "3")?.VAR_VALUE ||
                      "Feld3"}{" "}
                    {data.find((param) => param.HKL_Feld === "3")?.unit || ""}
                  </text>
                </g>
              )}

              {/* Button for Feld4 */}
              {data.find((param) => param.HKL_Feld === "4") && (
                <g
                  onClick={() =>
                    handleButtonClick(
                      data.find((param) => param.HKL_Feld === "4")!
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <rect x="403" y="405" width="40" height="30" fill="#3a485e" />
                  <text
                    x="409"
                    y="425"
                    fill="white"
                    fontSize="12"
                    fontFamily="Arial"
                  >
                    {data.find((param) => param.HKL_Feld === "4")?.VAR_VALUE ||
                      "Feld4"}{" "}
                    {data.find((param) => param.HKL_Feld === "4")?.unit || ""}
                  </text>
                </g>
              )}

              {/* Button for Feld5 */}
              {data.find((param) => param.HKL_Feld === "5") && (
                <g
                  onClick={() =>
                    handleButtonClick(
                      data.find((param) => param.HKL_Feld === "5")!
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <rect x="580" y="405" width="40" height="30" fill="#3a485e" />
                  <text
                    x="586"
                    y="425"
                    fill="white"
                    fontSize="12"
                    fontFamily="Arial"
                  >
                    {data.find((param) => param.HKL_Feld === "5")?.VAR_VALUE ||
                      "Feld5"}{" "}
                    {data.find((param) => param.HKL_Feld === "5")?.unit || ""}
                  </text>
                </g>
              )}

              {/* Button for Feld6 */}
              {data.find((param) => param.HKL_Feld === "6") && (
                <g
                  onClick={() =>
                    handleButtonClick(
                      data.find((param) => param.HKL_Feld === "6")!
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <rect x="355" y="290" width="40" height="30" fill="#3a485e" />
                  <text
                    x="360"
                    y="310"
                    fill="white"
                    fontSize="12"
                    fontFamily="Arial"
                  >
                    {data.find((param) => param.HKL_Feld === "6")?.VAR_VALUE ||
                      "Feld6"}{" "}
                    {data.find((param) => param.HKL_Feld === "6")?.unit || ""}
                  </text>
                </g>
              )}

              {/* Add similar blocks for Button 2 to 6 */}
            </g>
            <g id="Freigabe K&#195;&#188;hlen">
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
                id="Freigabe K&#195;&#188;hlen_2"
                fill="white"
                font-size="12"
                letter-spacing="0em"
              >
                <tspan x="264" y="316.864">
                  Freigabe&#10;
                </tspan>
                <tspan x="264" y="331.864">
                  K&#xfc;hlen
                </tspan>
              </text>
              <path
                id="Vector"
                d="M323.004 396.131V231.985"
                stroke="white"
                stroke-width="3"
                stroke-miterlimit="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <text
                id="Totband"
                fill="white"
                font-size="12"
                letter-spacing="0em"
              >
                <tspan x="353" y="285">
                  Totband
                </tspan>
              </text>
            </g>
            <g id="Freigabe Heizen">
              <rect
                id="Rectangle 1_2"
                x="428"
                y="288"
                width="47"
                height="7"
                fill="#FD2B2B"
              />
              <path
                id="Polygon 2_2"
                d="M497 291.5L473.75 304.923V278.077L497 291.5Z"
                fill="#FD2B2B"
              />
              <text
                id="Freigabe Heizen_2"
                fill="white"
                font-size="12"
                letter-spacing="0em"
              >
                <tspan x="441" y="314.864">
                  Freigabe&#10;
                </tspan>
                <tspan x="441" y="329.864">
                  Heizen
                </tspan>
              </text>
            </g>
            <g id="Frame 8">
              <text
                id="VL Min"
                fill="white"
                font-size="12"
                letter-spacing="0em"
              >
                <tspan x="256" y="61.8636">
                  VL Min:{" "}
                  {data.find((param) => param.HKL_Feld === "11")?.VAR_VALUE ||
                    " NA"}{" "}
                  {data.find((param) => param.HKL_Feld === "11")?.unit || ""}
                </tspan>
              </text>
              <text
                id="VL Max"
                fill="white"
                font-size="12"
                letter-spacing="0em"
              >
                <tspan x="411" y="61.8636">
                  VL Max:{" "}
                  {data.find((param) => param.HKL_Feld === "12")?.VAR_VALUE ||
                    " NA"}{" "}
                  {data.find((param) => param.HKL_Feld === "12")?.unit || ""}
                </tspan>
              </text>
            </g>
            <g id="Group">
              <path
                id="Vector_2"
                d="M54 67.3107L54 396.124"
                stroke="white"
                stroke-miterlimit="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                id="Vector_3"
                d="M54.0042 396.133H787.231"
                stroke="white"
                stroke-miterlimit="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                id="Vector_4"
                d="M152.273 362.117C322.877 203.831 537.875 101.608 768.331 69.2062"
                stroke="white"
                stroke-width="1.33333"
                stroke-miterlimit="3"
                stroke-linecap="square"
                stroke-dasharray="7 7"
              />
              <path
                id="Vector_5"
                d="M425.398 174.472C532.737 121.583 647.822 86.1437 766.32 69.4891"
                stroke="white"
                stroke-width="3"
                stroke-miterlimit="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                id="Vector_6"
                d="M425.714 174.311L425.717 396.124"
                stroke="white"
                stroke-width="3"
                stroke-miterlimit="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                id="Vector_7"
                d="M425.153 396.125L125.82 396.125"
                stroke="white"
                stroke-width="3"
                stroke-miterlimit="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                id="Vector_8"
                d="M220.903 303.324H54.0095"
                stroke="white"
                stroke-width="1.33333"
                stroke-miterlimit="3"
                stroke-linecap="square"
                stroke-dasharray="3 3"
              />
              <path
                id="Vector_9"
                d="M221.289 396.129L221.255 303.049"
                stroke="white"
                stroke-width="1.33333"
                stroke-miterlimit="3"
                stroke-linecap="square"
                stroke-dasharray="3 3"
              />
              <path
                id="Vector_10"
                d="M602.516 105.277L54.0087 105.105"
                stroke="white"
                stroke-width="1.33333"
                stroke-miterlimit="3"
                stroke-linecap="square"
                stroke-dasharray="3 3"
              />
              <path
                id="Vector_11"
                d="M599.394 396.129V105.102"
                stroke="white"
                stroke-width="1.33333"
                stroke-miterlimit="3"
                stroke-linecap="square"
                stroke-dasharray="3 3"
              />
            </g>
            <text
              id="AT in &#194;&#176;C"
              fill="white"
              font-size="12"
              letter-spacing="0em"
            >
              <tspan x="741" y="389.864">
                AT in &#xb0;C
              </tspan>
            </text>
            <text
              id="VL in &#194;&#176;C"
              fill="white"
              font-size="12"
              letter-spacing="0em"
            >
              <tspan x="34" y="61.8636">
                VL in &#xb0;C
              </tspan>
            </text>
          </g>
        </svg>

        {/* Modal for editing parameter values */}
        <Modal
          title={selectedParam?.NAME}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={handleSave}
        >
          <p>
            Min: {selectedParam?.MIN}, Max: {selectedParam?.MAX}
          </p>
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <VirtualKeyboard
            onInput={handleKeyboardInput}
            onDelete={handleDeleteInput}
          />
        </Modal>
      </Card>
    </div>
  );
}
