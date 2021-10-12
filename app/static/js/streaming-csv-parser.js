

// a TSV parser that parses the data incrementally in chunks
const csvChunkedParser = () => {
  const textDecoder = new TextDecoder("utf-8");
  let columnHeadings;
  let previousChunk = "";

  return {
    parseChunk(chunk) {
      // decode and split into lines
      const textData = previousChunk + textDecoder.decode(chunk);
      const lines = textData.split("\n");
      // the first line is our column headings
      if (!columnHeadings) {
        columnHeadings = lines[0].split(",");
        for (let i = 0; i < columnHeadings.length; i++) {
          columnHeadings[i] = columnHeadings[i].trim()
        }
        lines.shift();
      }
      // the last line is probably partial - so append to the next chunk
      previousChunk = lines.pop();
      // convert each row to an object
      const items = lines
        .map(row => {
          const cells = row.split(",");
          if (cells.length !== columnHeadings.length) {
            return null;
          }
          let rowValue = {};
          columnHeadings.forEach((h, i) => {
            rowValue[h] = cells[i];
          });
          return rowValue;
        })
        .filter(i => i);

      return items;
    }
  };
};

onmessage = async ({ data: filename }) => {
  let totalBytes = 0;

  const csvParser = csvChunkedParser();
  const response = await fetch(filename);

  if (!response.body) {
    throw Error("ReadableStream not yet supported in this browser.");
  }

  const streamedResponse = new Response(
    new ReadableStream({
      start(controller) {
        const reader = response.body.getReader();

        const read = async () => {
          const { done, value } = await reader.read();
          const items = csvParser.parseChunk(value);

          if (done) {
            controller.close();
            return;
          }

          totalBytes += value.byteLength;
          postMessage({ items, totalBytes });

          controller.enqueue(value);
          await read();
        };

        read();
      }
    })
  );

  const data = await streamedResponse.text();
  postMessage({ items: [], totalBytes: data.length, finished: true });
};
