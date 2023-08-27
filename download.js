const fs = require('fs');
const path = require('path');
const axios = require('axios');

const resultJsonsPath = './result_jsons';
const paperPath = './papers';
const errorsPath = './errors';

const download_pdf_files = async (jsonFile, resultJsonPath) => {
    // check if paper store path exists
    if (!fs.existsSync(path.resolve(__dirname, paperPath))) {
        fs.mkdirSync(path.resolve(__dirname, paperPath));
    }

    // check if error directory exists
    if (!fs.existsSync(path.resolve(__dirname, errorsPath))) {
        fs.mkdirSync(path.resolve(__dirname, errorsPath));
    }

    const topic = jsonFile.split('.')[0];
    // check if topic directory exists
    if (!fs.existsSync(path.resolve(__dirname, paperPath, topic))) {
        fs.mkdirSync(path.resolve(__dirname, paperPath, topic));
    }

    const errorFilePath = path.resolve(__dirname, errorsPath, topic + '_error.txt');

    const papersConfig = require(path.resolve(__dirname, resultJsonPath, jsonFile));

    const titleUrls = papersConfig.map((paperConfig) => {
        if (paperConfig === null)
            return null;

        const url = paperConfig['url'];
        const title = paperConfig['title'];

        if (title.startsWith('[HTML]')) {
            return null;
        }
        return [title, url];
    });

    titleUrls.map((titleUrl) => {
        // send binary encoding requests    
        if (titleUrl !== null) {
            axios.get(titleUrl[1], {
                responseType: "arraybuffer",
                responseEncoding: "binary"
            }).then((res) => {
                const filePath = path.resolve(__dirname, paperPath, topic, titleUrl[0] + '.pdf');
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, res.data);
                }
            }).catch((err) => {
                fs.appendFileSync(errorFilePath, titleUrl + '\n');
            });
        }
    });
};

(async () => {
    const resultJsonFiles = fs.readdirSync(resultJsonsPath);

    resultJsonFiles.map(async (resultJsonFile) => {
        await download_pdf_files(resultJsonFile, resultJsonsPath);
    });
})();