# HTTP Call using Axios

You can use external library such as [Axios](https://github.com/axios/axios) to do HTTP call in an Azure function.

```typescript
import axios from "axios";

const activityFunction: AzureFunction = async function (context: Context): Promise<ActivityOutput> {
    const response = await axios.get<YourCustomResponseBodyType>("<HTTP url here>");
    return response.data;
}

export default activityFunction;
```
