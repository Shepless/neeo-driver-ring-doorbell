# NEEO Driver - Ring Doorbell
So this is very basic and is just a couple of sensors, however I wanted to demo my idea behind introducing driver "settings" for both driver developers and end users of the drivers themselves. I see a gap here when browsing the forums where people are hard coding info into the drivers, which makes them not very adaptable or re-useable for people who do not know their way around code.

## Proposal
So most of this is documented in the `index.js` file, but at a high level what I'm proposing is that we allow developers to specify driver settings in their drivers `package.json`. Using `Joi` (and associated packages), we can very easily enable developers to "describe" the shape of the settings object (that would live in the root of a driver as `settings.json`). In addition, I would also propose that the SDK exposes helper functions to both generate and validate the `settings.json` file the driver requires. 99% of this will be abstracted away for the end user of the driver and we could even back this into the upcoming CLI, e.g. `neeo-sdk generate-settings <driver_name>`.

It's kind of hard to explain, so looking at the code and the comments will probably clear things up, but the rough end-to-end process would be:

1) Developer creates driver code
2) Developer adds entry into `package.json` for settings object shape
3) Developer adds their `settings.json` to their `.gitignore` so its not committed
4) Developer pushes code to git/npm
5) End user clones/installs driver
6) End user runs `neeo-sdk generate-settings <driver_name>`
7) CLI generates a boilerplate `settings.json` file in correct location
8) End user updates generated `settings.json` with their required info
9) End user runs driver

Step 7/8 could actually be very user friendly by using a tool like `inquirer` so it is an interactive CLI process, asking them to input the correct items specified in the settings object shape defined by the dev. So when the `settings.json` file is generated it is fully populated - no need for manually open/modification.

Would love to hear some feedback on this.
