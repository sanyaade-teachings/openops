import {
  ActionType,
  BranchStepOutput,
  flowHelper,
  FlowVersion,
  GenericStepOutput,
  LoopStepOutput,
  SplitStepOutput,
  StepOutputStatus,
  TriggerType,
} from '@openops/shared';
import { variableService } from '../../variables/variable-service';
import { FlowExecutorContext } from './flow-execution-context';

export const testExecutionContext = {
  async stateFromFlowVersion({
    flowVersion,
    excludedStepName,
    projectId,
    engineToken,
    apiUrl,
  }: {
    flowVersion: FlowVersion;
    excludedStepName?: string;
    projectId: string;
    apiUrl: string;
    engineToken: string;
  }): Promise<FlowExecutorContext> {
    const flowSteps = flowHelper.getAllSteps(flowVersion.trigger);
    let flowExecutionContext = FlowExecutorContext.empty();

    for (const step of flowSteps) {
      const {
        name,
        settings: { inputUiInfo },
      } = step;
      if (name === excludedStepName) {
        continue;
      }

      const stepType = step.type;
      switch (stepType) {
        case ActionType.BRANCH:
          flowExecutionContext = flowExecutionContext.upsertStep(
            step.name,
            BranchStepOutput.init({
              input: step.settings,
            }),
          );
          break;
        case ActionType.SPLIT: {
          flowExecutionContext = flowExecutionContext.upsertStep(
            step.name,
            SplitStepOutput.init({
              input: step.settings,
            }),
          );
          break;
        }
        case ActionType.LOOP_ON_ITEMS: {
          flowExecutionContext = flowExecutionContext.upsertStep(
            step.name,
            LoopStepOutput.init({
              input: step.settings,
            }).setOutput({
              item: inputUiInfo?.currentSelectedData?.item,
              index: 1,
              iterations: [],
            }),
          );
          break;
        }
        case ActionType.BLOCK:
        case ActionType.CODE:
        case TriggerType.EMPTY:
        case TriggerType.BLOCK:
          flowExecutionContext = flowExecutionContext.upsertStep(
            step.name,
            GenericStepOutput.create({
              input: step.settings,
              type: stepType,
              status: StepOutputStatus.SUCCEEDED,
              output: inputUiInfo?.currentSelectedData,
            }),
          );
          break;
      }
    }
    return flowExecutionContext;
  },
};
