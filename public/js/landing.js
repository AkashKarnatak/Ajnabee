const $ = (x) => document.querySelector(x);
const $$ = (x) => document.querySelectorAll(x);
const esc = (x) => {
    const txt = document.createTextNode(x);
    const p = document.createElement("p");
    p.appendChild(txt);
    return p.innerHTML;
};
let base = Math.floor(Math.random() * 50 + 30);
const noise = Math.floor(Math.random() * 10 - 5);
let allTags = [];

if (!sessionStorage.getItem("peopleOnline")) {
    sessionStorage.setItem("peopleOnline", base);
} else {
    base = +sessionStorage.getItem("peopleOnline");
}

function updateURL(tags) {
    const url = new URL(window.location.href);
    url.searchParams.set("tags", tags.join(","));
    window.history.pushState({}, "", url);
}

function initTagsFromURL() {
    const url = new URL(window.location.href);
    const tags = url.searchParams.get("tags");
    const $tags = $("#tag-container");
    if (tags) {
        let t = tags.split(",");
        allTags = t;
        t.forEach((value) => {
            const tag = document.createElement("div");
            tag.id = "tag";
            tag.innerHTML = `<p><span>${esc(value)}</span> ×</p>`;
            tag.style = "cursor: pointer";

            tag.onclick = () => {
                tag.remove();
                allTags = allTags.filter((x) => x !== tag.getElementsByTagName("span")[0].innerText);
                updateURL(allTags);
            };
            $tags.appendChild(tag);
        });
    }
}

function configureTags() {
    const $input = $("#interest-container input");
    const $tags = $("#tag-container");
    const $textBtn = $("#text-btn");
    const $videoBtn = $("#video-btn");

    $input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== ",") return;

        const value = $input.value.trim();
        if (!value) return;

        allTags.push(value);
        updateURL(allTags);
        const tag = document.createElement("div");
        tag.id = "tag";
        tag.innerHTML = `<p><span>${esc(value)}</span> ×</p>`;
        tag.style = "cursor: pointer";

        tag.onclick = () => {
            tag.remove();
            allTags = allTags.filter((x) => x !== tag.getElementsByTagName("span")[0].innerText);
            updateURL(allTags);
        };
        $tags.appendChild(tag);

        $input.value = "";

        e.preventDefault();
    });

    $textBtn.addEventListener("click", () => {
        const interests = Array.from($$("#tag p span")).map((x) => x.innerText);
        window.location.href = "/chat?" + new URLSearchParams({ interests });
    });

    $videoBtn.addEventListener("click", () => {
        allTags = [];
        const interests = Array.from($$("#tag p span")).map((x) => x.innerText);
        window.location.href = "/video?" + new URLSearchParams({ interests });
    });
}

async function getPeopleOnline() {
    const $peopleOnline = $("#peopleOnline p span");
    const res = await fetch("/online");
    if (!res.ok) {
        return console.error("Couldn't fetch GET /online");
    }
    const { online } = await res.json();
    console.log(online);

    $peopleOnline.innerHTML = base + noise + +online;
}

configureTags();
window.addEventListener("load", initTagsFromURL);
await getPeopleOnline();
