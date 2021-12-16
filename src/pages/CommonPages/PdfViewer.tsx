import React from "react";
import { useAsync, useWindowSize } from "react-use";
import { workFlowBaseUrl } from "../../Commmon/consts";
import { useQueryStringParser } from "../../hooks/useQueryStringParser";
import axios from "axios";

export default () => {
    const query = useQueryStringParser()
    const url = query.get('url')

    const link = useAsync(async () => {
        if (url) {
            var res = await axios({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onDownloadProgress: (e) => {
                    console.log(e)
                }
            })

            var blob = new Blob([res.data], {
                type: 'application/pdf;chartset=UTF-8'
            })
            let fileURL = URL.createObjectURL(blob)
            return fileURL
        }

    }, [url])


    const { height } = useWindowSize()
    return <div>
        {link.loading ? <label>加载中</label> : <iframe src={`${workFlowBaseUrl}/spa/pdfjs/web/viewer.html?file=${encodeURIComponent(link.value??'')}`} style={{
            width: "100%", height: height - 20,
            border: '0px'
        }}></iframe>}

    </div>
}