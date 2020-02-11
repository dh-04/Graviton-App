
import {puffin} from '@mkenzo_8/puffin'
import ThemeProvider from '../../utils/themeprovider'
const os = eval('process.platform')

if(os == "win32"){
    var Buttons = puffin.element(`
        <div class="buttons ${puffin.style.css`
            ${ThemeProvider}
            rect{
                stroke:{{controlButtonsFill}};
            }
            rect.fill{
                fill:{{controlButtonsFill}};
            }
            & button{
                border:0;
                margin:0;
                flex-align:right;
                min-height:40px;
                padding:0px 12px;
                outline:0;
                left:0;
                background:transparent;
            }
            & button:hover{
                background:{{controlButtonsHoverBackground}};
            }
            & button:nth-child(3):hover{
                background:{{controlCloseButtonHoverBackground}};
                fill:{{controlCloseButtonHoverFill}};
            }
        `}">
            <button title="Minimize">
                <svg xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate" viewBox="0 0 24 24" width="24" height="24">
                    <rect x="7" y="11.5" width="10" height="0.8" transform="matrix(1,0,0,1,0,0)" />
                </svg>
            </button>
            <button title="Maximize">
                <svg width="24" height="24" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="16" y="16" width="18.5714" height="18.5714"  stroke-width="2" />
                </svg>
            </button>
            <button title="Close">
                <svg width="20" height="20" viewBox="0 0 174 174" xmlns="http://www.w3.org/2000/svg">
                    <rect class="fill" x="40.3309" y="127.305" width="123" height="9" rx="4.5" transform="rotate(-45 40.3309 127.305)" />
                    <rect class="fill" x="127.305" y="133.669" width="123" height="9" rx="4.5" transform="rotate(-135 127.305 133.669)"  />
                </svg>
            </button>
        </div>
    `)
}else{
    var Buttons = puffin.element(`
        <div class="buttons ${puffin.style.css`
            & {
                margin:0px
                min-height:40px;
                margin:0;
                padding:0;
                display:flex;
                align-items:center;
                margin:0 5px;
            }
            & > button {
                border-radius: 100px;
                height:12px;
                padding:0px 12px;
                border: 0px;
                width: 12px;
                padding: 0px;
                margin: 0px 3px;
                background: gray;
                
            }

            
            & > button[title="Close"]:active{
                background: #D0716C !important;
		        border: 1px solid #AA4F4B !important;
            }
            & > button[title="Close"]:hover{
                background: #FF746D;
		        border: 1px solid #f85a52;
            }
            & > button[title="Close"]{
                background: #FF746D;
	            border: 1px solid #f85a52;
            }
          
            
            & > button[title="Minimize"]:active{
                background: #E0AD38;
                border: 1px solid #B38B2E;
            }
            & > button[title="Minimize"]:hover{
                background: #fdbe2e;
		        border: 1px solid #DFA620;
            }
            & > button[title="Minimize"]{
                background: #fdbe2e;
	            border: 1px solid #DFA620;
            }

            
            & > button[title="Zoom"]:active{
                background: #27cb41;
                border: 1px solid #1AAC2F;
            }
            & > button[title="Zoom"]:hover{
                background: #1DE33D;
		        border: 1px solid #1ECE38;
            }
            & > button[title="Zoom"]{
                background: #1DE33D;
	            border: 1px solid #1ECE38;
            }

        `}">
            <button title="Close" >
                <img/>
            </button>
            <button title="Minimize">
                <img/>
            </button>
            <button title="Zoom">
                <img/>
            </button>
        </div>
    `)
}

export default Buttons