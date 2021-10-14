class Transaction {
  store = '';
  logs = [];

  async dispatch(scenario) {
    //sort scenario
    scenario = scenario.sort((first, second) => first.index - second.index);

    for (let current of scenario) {
      if (!current.call) throw new Error('No Call Function is specified');
      if (!current.index) throw new Error('No Index Is specified');
      if (!current.meta || !current.meta.title || !current.meta.description)
        throw new Error('No Meta or some property of meta');

      try {
        this.logs.push({
          index: current.index,
          meta: current.meta,
          storeBefore: current,
          storeAfter: await current.call(),
          error: null,
        });

        this.store = null;
      } catch (e) {
        this.logs.push({
          index: current.index,
          meta: current.meta,
          storeBefore: current,
          error: { name: e.name, message: e.message, stack: e.stack },
        });

        if (current.restore) {
          try {
            this.logs.push({
              index: current.index,
              meta: current.meta,
              storeBefore: current,
              storeAfter: await current.restore(),
            });
          } catch (e) {
            this.store = {};

            this.logs.push({
              index: current.index,
              meta: current.meta,
              error: { name: e.name, message: e.message, stack: e.stack },
            });

            for (let i = current.index - 2; i >= 0; i--) {
              if (!scenario[i].restore)
                throw new Error(
                  `Cannot restore because there is no restore ! on index ${scenario[i].index}`
                );
              try {
                await scenario[i].restore();
                this.logs.push({
                  index: scenario[i].index,
                  meta: scenario[i].meta,
                  error: null,
                });
              } catch (e) {
                err.name = e.name;
                err.message = e.message;
                err.stack = e.stack;

                this.logs.push({
                  index: scenario[i].index,
                  meta: scenario[i].meta,
                  error: { name: e.name, message: e.message, stack: e.stack },
                });
              }
            }
            break;
          }
        }
      }
    }
    return this.logs;
  }
}

const scenario = [
  {
    index: 1,
    meta: {
      title: 'Read popular customers',
      description:
        'This action is responsible for readin_g the most popular customers',
    }, // callback for main execution
    call: async (store) => {
      return `Success called the 1-th step`;
    },
    restore: async (store) => {
      return 'Success restored the 1-st step';
      throw new Error('estoring error on first step');
    }, // callback for rollback
  },
  {
    index: 2,
    meta: {
      title: 'Delete customer',
      description: 'This action is responsible for deleting customer',
    }, // callback for main execution
    call: async (store) => {
      return 'Success called the second step';
    },
    restore: async (store) => {
      return 'Success restored the 2-nd step';
    }, // callback for rollback
  },
  {
    index: 3,
    meta: {
      title: 'Delete customer',
      description: 'This action is responsible for deleting customer',
    }, // callback for main execution
    call: async (store) => {
      return `Success called the 3-th step`;
    },
    restore: async (store) => {
      return `The 3-th step restored successfully`;
    },
  },
  {
    index: 5,
    meta: {
      title: 'Delete customer',
      description: 'This action is responsible for deleting customer',
    }, // callback for main execution
    call: async (store) => {
      throw new Error('Error on the fifth step');
    },
    restore: async (store) => {
      return `The 5-th step restored successfully`;
    },
  },
  {
    index: 4,
    meta: {
      title: 'Delete customer',
      description: 'This action is responsible for deleting customer',
    }, // callback for main execution
    call: async (store) => {
      throw new Error(`Error on the fourth step`); // return 'Success on the fourth step';
    },
    restore: async (store) => {
      throw new Error(`Restore error the 4th step`);
      return `The 4th step restored successfully`;
    },
  },
];

const transaction = new Transaction();

(async () => {
  try {
    await transaction.dispatch(scenario);
    const store = transaction.store; // {} | null
    const logs = transaction.logs; // []
    console.log(logs);
    console.log(store);
  } catch (err) {
    console.log({ name: err.name, message: err.message, stack: err.stack });
  }
})();

//LOGS
/* [
                    {
                        index: 1,
                        meta: {
                            title: 'Read popular customers'
                            description: 'This action is responsible for reading the most popular customers'
                        },
                        storeBefore: {},
                        storeAfter: {},
                        error: null
                    },
                    {
                        index: 2,
                        meta: {
                            title: 'Add customer'
                            description: 'This action will add some customer'
                        },
                        error: {
                            name: 'TypeError',
                            message: 'name is not a function',
                            stack: 'Stack trace'
                        }
                    }
                ]  */
