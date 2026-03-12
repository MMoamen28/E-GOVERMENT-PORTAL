import axios from "axios";

export class GoRulesService {

  async evaluateRules(data: any) {

    const response = await axios.post(
      "http://localhost:8082/decision/evaluate",
      {
        decision: "scholarship-rules",
        input: data
      }
    );

    return response.data;
  }

}
