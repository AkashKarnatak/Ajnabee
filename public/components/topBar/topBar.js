
const topBarTemplate = document.createElement("template");
topBarTemplate.innerHTML = `

<link href="components/topBar/topBar.css" rel="stylesheet">
	<div id="top-bar">
				<div id="logo">
					<h1>Boujee</h1>
				</div>
        <div id="top-right">
          <div id="peopleOnline">
            <p><span>0</span>+ online now</p>
          </div>
          <button id="feedback-btn" class="button">
            Provide Feedback
          </button>
        </div>
	</div>
`;

class topBar extends HTMLElement {
    constructor() {
        // Always call super first in constructor
        super();
    }

    connectedCallback() {
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(topBarTemplate.content);
    }
}

customElements.define("top-bar", topBar);
