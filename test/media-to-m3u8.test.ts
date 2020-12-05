import MediaToM3u8 from "../src";

describe("Media To M3u8", () => {

  jest.useFakeTimers();

  it("Initiate class", () => {
    const object = new MediaToM3u8('out.m3u8');
    expect(object.getDestination).toBe('out.m3u8');
  });

  it("Add source", () => {
    const object = new MediaToM3u8('out.m3u8');
    object.addSource('source.mp4');
    expect(object.getSources[0]).toBe('source.mp4');
  });

  it("Start the convertion process", () => {
    const object = new MediaToM3u8('out.m3u8');
    spyOn<any>(object, 'convert');
    object.addSource('source.mp4');
    object.start();
    jest.runTimersToTime(1001);
    expect(object['convert']).toBeCalled();
  });

  it("Not start the convertion process if already running", () => {
    const object = new MediaToM3u8('out.m3u8');
    spyOn<any>(object, 'convert').and.callThrough();
    spyOn<any>(object, 'runFfmpeg').and.returnValue(Promise.resolve());
    object.addSource('source.mp4');
    object.start();
    object.start();
    jest.runTimersToTime(1001);
    expect(object['convert']).toBeCalledTimes(1);
  });

  it("Run convertion process for each source", () => {
    const object = new MediaToM3u8('out.m3u8');
    spyOn<any>(object, 'convert');
    object.addSource('source1.mp4');
    object.addSource('source2.mp4');
    object.addSource('source3.mp4');
    object.start();
    const sourceCount = object.getSources.length;
    jest.runTimersToTime(1001 * sourceCount);
    expect(object['convert']).toBeCalledTimes(sourceCount);
  });
})
