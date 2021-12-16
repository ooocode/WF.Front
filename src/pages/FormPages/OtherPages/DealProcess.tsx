import { Checkbox } from "antd"
import React, { useRef, useState } from "react"
import { useAsync } from "react-use"
import { userTasksClient } from "../../../hooks/useApi"
import { useQueryStringParser } from "../../../hooks/useQueryStringParser"

const DealProcess = () => {
    const query = useQueryStringParser()
    const businessKey = query.get('businessKey')

    const runtimeActivityInstance = useAsync(async () => {
        if (businessKey) {
            const res = await userTasksClient.getRuntimeUserTaskByBusinessKey(businessKey)
            return res
        }
    }, [businessKey])


    return <div>
      
    </div>
}

export default DealProcess