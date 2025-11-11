import { createMachine, assign } from 'xstate';

const PlayGameMachine = (uuidsList) =>
  createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMD2A7AVmZAXArgE5gB0AlhADZgDEAMgPICCAIgPoByAogBoAqAbQAMAXUSgADqlhlcZDOJAAPRAEYAzEJIAWAJz7dADnWGATOt3aAbABoQATzWmA7DoP7nQ1aYCs6n6oAvoF2aFg4BMQklKgAhhBk6FA0wmJIIFIycgrpKgiqPtokzoa6Qlba6uqq3s7ado4IhqpuBs7eQpW6zs7BoRjYeESkMfGJyQKqaZLSsvLoinkWrl4+VpraplbrLg2IpSQ+xlWmXuolQoaGwSEg6KgQcIphg5FgiplzOaB5ALS2DkQ-z6IBeEWG5Co73Sn2yC1yiE2eyaPhIVSq2g03kMdSMILBQyiowSSQ+szhi0QpgO2mcVjWhVUtPUVkMyJxJGO6mpVlMmIqm3xA3BUTA6AgZKy80pCB8Pl0nICPk8LnpPQBjUMVkOx28+j0mKEvRuQA */
    id: 'conjecture',
    initial: 'idle',
    context: {
      uuids: uuidsList,
      uuidIndex: 0,
    },
    states: {
      idle: {
        on: {
          LOAD_NEXT: {
            target: 'loading',
            actions: ['loadNextUuid'],
          },
        },
      },
      loading: {
        always: [
          {
            target: 'idle',
            cond: (context) => context.uuidIndex < context.uuids.length,
          },
          {
            target: 'end',
          },
        ],
      },
      end: {
        type: 'final',
      },
    },
  }, {
    actions: {
      loadNextUuid: assign({
        uuidIndex: (context) => context.uuidIndex + 1,
      }),
    },
  });

export default PlayGameMachine;
