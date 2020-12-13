const parseCategoryXML = (xml) => {
  console.log(xml);
  xml = xml.replace(/\&/g, "ᗢ");
  const parser = new DOMParser();
  return parser.parseFromString(xml, "text/xml");
};

const getHENScript = (doc) => {
  console.log(doc.getElementById("hen_xmb"));
  return doc
    .getElementById("hen_xmb")
    .querySelector('Pair[key="module_action"] String')
    .textContent.replace(/ᗢ/g, "&");
};

const getMatches = (doc) => {
  const backReplaces = [
    /font-weight:bold;color:(.+?);padding-top:16px/,
    /background:(.+?)}#c div:nth-child\(1\)/,
    /left:48px;border:8px solid (.+?);background-color:transparent;/,
    /font-size:26px;font-weight:bolder;text-shadow:0px 4px (.+?);color:.+?;letter-spacing:-24px}#c div:nth-child\(5\)/,
    /text-shadow:3px 0px (.+?)}#c div:nth-child\(6\)/,
  ];

  const frontReplaces = [
    /-webkit-border-radius:180px;background-color:(.+?);width:160px;/,
    /border:6px solid (.+?);background-color:transparent/,
    /border:3px solid (.+?)}#c/,
  ];

  backReplaces.forEach((rep) => {
    doc = doc.replace(
      rep,
      rep
        .toString()
        .replace(/\(\.\+\?\)/g, hexToShortHex(colorValues.front))
        .replace(/\\/g, "")
        .split("")
        .slice(1, -1)
        .join("")
    );
  });
  frontReplaces.forEach((rep) => {
    doc = doc.replace(
      rep,
      rep
        .toString()
        .replace(
          /\(\.\+\?\)/g,
          // hexToRgbA(colorValues.back, colorValues.opacityBack.toFixed(1))
          hexToShortHex(colorValues.back)
        )
        .replace(/\\/g, "")
        .split("")
        .slice(1, -1)
        .join("")
    );
  });

  doc = doc.replace("color:.+?;", `color:${hexToShortHex(colorValues.front)};`);
  return doc;
};

const getCategoryXML = () => {
  if (originalXML && originalXML !== "") {
    return Promise.resolve(originalXML);
  }
  return fetch(
    `http://${ps3ip.value}/dev_flash/vsh/resource/explore/xmb/category_game.xml`
  )
    .then((r) => r.text())
    .then((text) => {
      originalXML = text;
      return text;
    });
};

//
let offset = 0;
const pageSize = 1280;
const writeChunk = (path, chunk, index) => {
  const method = index === 0 ? "write.ps3" : "write_ps3";
  // ?f=<path>&t=<hex>&pos=<offset>

  return fetch(
    `http://${ps3ip.value}/write.ps3?f=/${path}&t=${chunk}&pos=${offset}`,
    {
      mode: "no-cors",
    }
  )
    .then((a) => {
      offset += pageSize / 2;
      return a;
    })
    .catch(() => {});
};
const writeChunks = function (path, chunks) {
  return chunks.reduce((p, chunk, index) => {
    return p.then(() => writeChunk(path, chunk, index));
  }, Promise.resolve()); // initial
};

const postFile = (path, contents) => {
  fetch(`http://${ps3ip.value}/delete_ps3/${path}`, {
    mode: "no-cors",
  })
    .then(() => {
      offset = 0;
      const fileChunks = contents.match(/(.|[\r\n]){1,1280}/g);
      writeChunks(path, fileChunks).then(() => {
        return fetch(`http://${ps3ip.value}/restart.ps3?soft`, {
          mode: "no-cors",
        }).catch(() => {});
      });
    })
    .catch(() => {});
};

const toUTF8Array = (str) => {
  let utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode =
        0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
};

const writeCategory = (text) => {
  if (!checkPS3IP()) {
    return;
  }
  pingPS3().then(() => {
    const doc = toUTF8Array(text)
      .map((a) => {
        return a.toString(16).padStart(a <= 255 ? 2 : 4, "0");
      })
      .join("");
    postFile("dev_rewrite/vsh/resource/explore/xmb/category_game.xml", doc);
  });
};
