import { lookTaskMode } from "../Commmon/task";
import { useQueryStringParser } from "./useQueryStringParser";

export function useFormQueryString() {
    const query = useQueryStringParser()
    const prodefKey = query.get('form')
    const taskId = query.get('taskId')
    const businessKey = query.get('businessKey')
    const mode = query.get('mode') as lookTaskMode

    return {
        prodefKey: prodefKey,
        taskId: taskId,
        businessKey: businessKey,
        mode: mode
    }
}