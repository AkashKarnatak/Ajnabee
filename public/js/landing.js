document.getElementById("input-tag").addEventListener("keyup", function (event) {
    if (event.key === "Enter" && event.target.value !== "") {
        console.log("enter is clicked", event.target.value);
        let tag = document.createElement("span");
        tag.classList.add("tag");
        tag.innerText = event.target.value + " x";
        tag.onclick = function () {
            tag.remove();
        };
        event.target.value = "";
        document.getElementById("tags-categories").appendChild(tag);
    }
});

 //Selector for your <video> element
    // const video = document.querySelector('#myVidPlayer');

    // //Core
    // window.navigator.mediaDevices.getUserMedia({ video: true })
    //     .then(stream => {
    //         video.srcObject = stream;
    //         video.onloadedmetadata = (e) => {
    //             video.play();
    //         };
    //     })
    //     .catch( () => {
    //         alert('You have give browser the permission to run Webcam and mic ;( ');
    //     });
