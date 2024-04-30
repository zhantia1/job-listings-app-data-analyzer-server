
require('dotenv').config();

// mock processData
jest.mock('../../src/index', () => ({
    ...jest.requireActual('../../src/index'),
    processData: jest.fn() // this line mocks processData
}));

const { startConsumer, processData }  = require('../../src/index');
const amqp = require('amqplib');
const env = process.env.ENVIRONMENT;

if (env === "test-local") {
    describe('RabbitMQ Integration', () => {   
        
        it('sends a message to the queue correctly', async () => {

            // start consumer
            await startConsumer(processData);

            // send a message to the process-data queue
            const conn = await amqp.connect(process.env.CLOUDAMQP_URL);
            const channel = await conn.createChannel();
            const message = "trigger_process_data";
            channel.sendToQueue('process_data_queue', Buffer.from(JSON.stringify(message)), {
              persistent: true
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // check if processData was called
            expect(processData).toHaveBeenCalledTimes(1);

            await channel.close();
            await conn.close();
            
        });
      });
}

describe("test file must contain one test", () => {
    it("should return true", () => {
        expect(true).toEqual(true);
    })
})