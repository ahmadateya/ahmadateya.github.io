# My Online CV

this CV is built on [sproogen/modern-resume-theme](https://github.com/sproogen/modern-resume-theme) taking the skill part from [Haki-Malai/cv](https://github.com/Haki-Malai/cv) with my edits.

----
## Running locally

Before you start make sure you have *Ruby* and the gems for *Jekyll* installed locally. You can find out how to do that [here](https://jekyllrb.com/docs/installation/).

- install Ruby jems
```bash 
bundle install
```
- Serve
```bash 
bundle exec jekyll serve
```

- Open your browser to [http://localhost:4000](http://localhost:4000)

Any changes you make will automatically build and you will be able to see these by refreshing your browser.

*Note: You will need to re-run `bundle exec jekyll serve` to see changes made in `_config.yml`.*


### Docker
If you have docker installed you can simply run `docker-compose up` to launch the site in a container, it will then be hosted at [http://localhost:4000](http://localhost:4000)

----