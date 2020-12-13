const circleColor = document.getElementById("circleColor");
const textColor = document.getElementById("textColor");
// const circleColorOpacity = document.getElementById("circleColorOpacity");

const preview = document.getElementById("preview");
const save = document.getElementById("save");
const ps3ip = document.getElementById("ps3ip");

const dotBack = Array.from(document.querySelectorAll(".back"));
const dotBack1 = Array.from(document.querySelectorAll(".back1"));
const dotFront = Array.from(document.querySelectorAll(".front"));

let pingPS3PingDone = false;
let originalXML;
let originalJS;

const colorValues = {
  front: "#000000",
  back: "#ffffff",
  opacityBack: 1,
};

const hexToShortHex = (hex) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        "#",
        Math.floor(parseInt(result[1], 16) / 16).toString(16),
        Math.floor(parseInt(result[2], 16) / 16).toString(16),
        Math.floor(parseInt(result[3], 16) / 16).toString(16),
      ].join("")
    : null;
};

const rgbaToAlphaHex = (rgba) => {
  const props = ["r", "g", "b", "opacity"];
  const result = rgba
    .split(",")
    .map((e) => {
      return e.trim();
    })
    .map((value, index) => {
      if (index != 3) {
        return parseInt(value, 10).toString(16);
      }
      return parseFloat(value).toFixed(1);
    })
    .reduce((acc, fragment, index) => {
      acc[props[index]] = fragment;
      return acc;
    }, {});
  result.hex = result.r + result.g + result.b;
  return {
    opacity: result.opacity,
    color: result.hex,
  };
};

const hexToRgbA = (hex, opacity) => {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split("");
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = "0x" + c.join("");
    return (
      "rgba(" +
      [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
      "," +
      opacity +
      ")"
    );
  }
  throw new Error("Bad Hex");
};

function updateColorValues() {
  const { front, back, opacityBack } = colorValues;
  dotBack.forEach((el) => {
    el.setAttribute("stroke", back);
    el.setAttribute("opacity", opacityBack);
  });
  dotBack1.forEach((el) => {
    el.setAttribute("fill", back);
    el.setAttribute("opacity", opacityBack);
  });
  dotFront.forEach((el) => {
    el.setAttribute("fill", front);
  });
}

const checkPS3IP = () => {
  if (
    !/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/.test(ps3ip.value)
  ) {
    alert("Invalid PS3 address");
    return false;
  }
  return true;
};

const pingPS3 = () => {
  if (pingPS3PingDone) {
    return Promise.resolve();
  }
  return fetch(`http://${ps3ip.value}/cpursx_ps3`, { mode: "no-cors" })
    .then(
      () => {
        this.ps3ip.setAttribute("disabled", "");
        pingPS3PingDone = true;
      },
      () => {
        alert(
          "Unable to connect to your PS3. Are you sure is your PS3 is connected to the same Computer LAN/WLAN?"
        );
      }
    )
    .catch(() => {
      alert(
        "Unable to connect to your PS3. Are you sure is your PS3 is connected to the same Computer LAN/WLAN?"
      );
    });
};

const doPreview = () => {
  const { front, back, opacityBack } = colorValues;
  const url = `http://${ps3ip.value}/browser.ps3?${
    window.location.origin
  }/preview.html?front=${front.replace("#", "$")}&back=${hexToRgbA(back, 1)
    .replace("rgba(", "")
    .replace(")", "")
    .split(",")
    .slice(0, 3)
    .concat(opacityBack)
    .join(",")}`;

  fetch(url, {
    mode: "no-cors",
  }).catch(() => {});
};

circleColor.addEventListener("input", () => {
  colorValues.back = circleColor.value;

  updateColorValues();
});

textColor.addEventListener("input", () => {
  colorValues.front = textColor.value;
  updateColorValues();
});

// circleColorOpacity.addEventListener("input", () => {
//   colorValues.opacityBack = circleColorOpacity.value / 100;
//   updateColorValues();
// });

preview.addEventListener("click", () => {
  if (!checkPS3IP()) {
    return;
  }
  pingPS3().then(doPreview);
});

save.addEventListener("click", () => {
  getCategoryXML()
    .then(parseCategoryXML)
    .then(getHENScript)
    .then((e) => {
      originalJS = e;
      return e;
    })
    .then(getMatches)
    .then((text) => {
      writeCategory(originalXML.replace(originalJS, text));
    });
});

updateColorValues();
