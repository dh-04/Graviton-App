import Title from "../../../components/Primitive/Title";
import TabText from "../../../components/Tabs/TabText";
import WebPackage from "../../../../package.json";
import { useSetRecoilState } from "recoil";
import { showedWindowsState } from "../../../state/state";
import { Popup } from "../../../modules/popup";
import { SecondaryButton } from "../../../components/Primitive/Button";

const LICENSE = `
MIT License

Copyright (c) Marc Espín Sanz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

`;

export default function AboutRoute() {
  const setShowedWindows = useSetRecoilState(showedWindowsState);

  function showLicensePopup() {
    setShowedWindows((val) => [
      ...val,
      new Popup(
        { text: "License" },
        { text: LICENSE },
        [
          {
            label: {
              text: "Dismiss",
            },
            action: () => {
              /**/
            },
          },
        ],
        535,
        600,
      ),
    ]);
  }

  return (
    <div>
      <Title>Graviton Editor</Title>
      <TabText>You are running v{WebPackage.version} (pre-alpha)</TabText>
      <SecondaryButton onClick={showLicensePopup}>View License</SecondaryButton>
    </div>
  );
}
